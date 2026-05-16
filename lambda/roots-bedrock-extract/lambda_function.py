#Triggered through direct call from roots-translate/lambda_function.py.
#Sends translated text to Claude and asks for information like name of
#speaker, year video was taken, location, theme, summary, and preview quote.
#Claude returns as JSON and this is saved into DynamoDB to be displayed by Archive page.

import boto3
import json

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('roots-stories')

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
        modelId='anthropic.claude-haiku-4-5-20251001',
        body=json.dumps({
            'anthropic_version': 'bedrock-2023-05-31',
            'max_tokens': 1000,
            'messages': [{'role': 'user', 'content': prompt}]
        })
    )
    
    result = json.loads(response['body'].read())
    extracted = json.loads(result['content'][0]['text'])
    
    # Save to DynamoDB
    table.put_item(Item={
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
    })
    
    print(f"Story {job_name} saved to DynamoDB!")
    return {'statusCode': 200, 'body': 'Story saved to DynamoDB'}