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
Return ONLY the translated text, nothing else.

Text:
{transcript}"""
            }]
        })
    )

    result = json.loads(response['body'].read())
    translated_text = result['content'][0]['text'].strip()

    lambda_client.invoke(
        FunctionName='roots-bedrock-extract',
        InvocationType='Event',
        Payload=json.dumps({
            'job_name': job_name,
            'bucket': bucket,
            'original_transcript': transcript,
            'translated_text': translated_text,
            'source_language': 'auto'
        })
    )

    return {'statusCode': 200, 'body': 'Translation done via Claude'}