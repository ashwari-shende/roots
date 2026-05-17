# Triggered through direct call from roots-claude-translate/lambda_function.py.
# Sends translated text to Claude and asks for structured info (name, year, location, theme, summary, preview).
# Saves to DynamoDB for the Archive page, then uploads a prose version to S3 and triggers a
# Bedrock Knowledge Base ingestion job so the chatbot can answer questions about the new story.

import boto3
import json
import os

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
bedrock_agent = boto3.client('bedrock-agent', region_name='us-east-1')
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('roots-stories')

# Knowledge Base config — override via env vars if these IDs ever change
STORIES_BUCKET = os.environ.get('STORIES_BUCKET', 'roots-stories-archive')
KB_ID = os.environ.get('KB_ID', 'VBOYBDAIY7')
KB_DATA_SOURCE_ID = os.environ.get('KB_DATA_SOURCE_ID', 'SLXRXVOU1Z')


def lambda_handler(event, context):
    job_name = event['job_name']
    original_transcript = event['original_transcript']
    translated_text = event['translated_text']
    source_language = event['source_language']

    # Ask Claude to extract story details
    prompt = f"""You are helping preserve community stories. Extract structured information from this story transcript.

Transcript:
{translated_text}

Return ONLY a JSON object with these fields:
{{
  "narrator_name": "name if mentioned, otherwise Unknown",
  "year": "year or decade the story is set, if mentioned",
  "location": "place the story is set, if mentioned",
  "theme": "one of: Family, Migration, Community, Food, Work, Love, Loss, Tradition, Other",
  "summary": "2-3 sentence summary of the story",
  "preview": "one compelling sentence from or about the story, max 200 characters"
}}

Return only the JSON, no other text."""

    response = bedrock.invoke_model(
        modelId='us.anthropic.claude-sonnet-4-5-20250929-v1:0',
        body=json.dumps({
            'anthropic_version': 'bedrock-2023-05-31',
            'max_tokens': 1000,
            'messages': [{'role': 'user', 'content': prompt}]
        })
    )

    result = json.loads(response['body'].read())
    #extracted = json.loads(result['content'][0]['text'])
    raw_text = result['content'][0]['text']
    clean_text = raw_text.strip().removeprefix('```json').removeprefix('```').removesuffix('```').strip()
    extracted = json.loads(clean_text)

    item = {
        'storyId': job_name,
        'narratorName': extracted.get('narrator_name', 'Unknown'),
        'year': extracted.get('year', ''),
        'location': extracted.get('location', ''),
        'theme': extracted.get('theme', 'Other'),
        'summary': extracted.get('summary', ''),
        'preview': extracted.get('preview', ''),
        'originalTranscript': original_transcript,
        'translatedText': translated_text,
        'sourceLanguage': source_language,
    }

    # Save to DynamoDB
    table.put_item(Item=item)
    print(f"Story {job_name} saved to DynamoDB")

    # Upload to S3 + trigger KB ingestion (failures here are logged but do NOT fail the handler —
    # the story is already preserved in DynamoDB and Archive, this is just the chatbot index)
    try:
        upload_story_to_s3(item)
        trigger_kb_ingestion()
        print(f"Story {job_name} uploaded to S3 and KB ingestion started")
    except Exception as e:
        print(f"WARNING: chatbot indexing failed for {job_name}: {e}")

    return {'statusCode': 200, 'body': 'Story saved to DynamoDB and indexed'}


def upload_story_to_s3(item):
    """Format a DynamoDB item as natural prose and upload to the KB bucket."""
    body = format_story_text(item)
    key = f"{item['storyId']}.txt"
    s3.put_object(
        Bucket=STORIES_BUCKET,
        Key=key,
        Body=body.encode('utf-8'),
        ContentType='text/plain; charset=utf-8',
    )


def format_story_text(item):
    """Turn a DynamoDB item into the narrative .txt format the KB indexes."""
    name = item.get('narratorName') or 'Unknown'
    year = item.get('year') or 'unknown year'
    location = item.get('location') or 'unknown location'
    theme = item.get('theme') or 'Other'
    summary = item.get('summary') or ''
    preview = item.get('preview') or ''
    transcript = item.get('translatedText') or ''

    return (
        f"Story from {name}\n"
        f"Year: {year}\n"
        f"Location: {location}\n"
        f"Theme: {theme}\n\n"
        f"Summary: {summary}\n\n"
        f"Preview: {preview}\n\n"
        f"Full story:\n{transcript}\n"
    )


def trigger_kb_ingestion():
    """Kick off a Bedrock KB ingestion job. Fire-and-forget — the job runs async."""
    bedrock_agent.start_ingestion_job(
        knowledgeBaseId=KB_ID,
        dataSourceId=KB_DATA_SOURCE_ID,
    )