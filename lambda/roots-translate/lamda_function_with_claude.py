import boto3
import json

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
lambda_client = boto3.client('lambda')

def lambda_handler(event, context):
    job_name = event['job_name']
    bucket = event['bucket']
    transcript = event['transcript']

    response = bedrock.invoke_model(
        modelId='us.anthropic.claude-sonnet-4-6',
        body=json.dumps({
            'anthropic_version': 'bedrock-2023-05-31',
            'max_tokens': 4096,
            'messages': [{
                'role': 'user',
                'content': f"""Detect the language of this text and translate it to English.
If it is already in English, return it as-is.

Return ONLY a JSON object with two fields:
{{
  "detected_language": "the full English name of the language, e.g. Spanish, Somali, English",
  "translated_text": "the full translated text in English"
}}

Text:
{transcript}"""
            }]
        })
    )

    result = json.loads(response['body'].read())
    raw_text = result['content'][0]['text'].strip()
    clean_text = raw_text.removeprefix('```json').removeprefix('```').removesuffix('```').strip()
    parsed = json.loads(clean_text)

    detected_language = parsed.get('detected_language', 'English')
    translated_text = parsed.get('translated_text', transcript)

    print(f"Detected language: {detected_language}")
    print(f"Translated text: {translated_text[:100]}...")

    lambda_client.invoke(
        FunctionName='roots-bedrock-extract',
        InvocationType='Event',
        Payload=json.dumps({
            'job_name': job_name,
            'bucket': bucket,
            'original_transcript': transcript,
            'translated_text': translated_text,
            'source_language': detected_language
        })
    )

    return {'statusCode': 200, 'body': 'Translation done via Claude'}