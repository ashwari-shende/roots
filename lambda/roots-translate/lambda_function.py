#Triggered through direct call by roots-check-transcription/lambda_function.py.
#Auto-detects language and sends transcript to AWS Translate to be put in English.
#Calls roots-bedrock-extract/lamda_function.py and passes both og and translated transcript.

import boto3
import json

translate = boto3.client('translate')
lambda_client = boto3.client('lambda')

def lambda_handler(event, context):
    job_name = event['job_name']
    bucket = event['bucket']
    transcript = event['transcript']
    
    # Translate to English (handles if story was told in another language)
    response = translate.translate_text(
        Text=transcript,
        SourceLanguageCode='auto',  # auto-detect language
        TargetLanguageCode='en'
    )
    
    translated_text = response['TranslatedText']
    source_language = response['SourceLanguageCode']
    
    print(f"Translated from {source_language} to en: {translated_text[:100]}...")
    
    # Trigger Bedrock extraction Lambda
    lambda_client.invoke(
        FunctionName='roots-bedrock-extract',
        InvocationType='Event',  # async
        Payload=json.dumps({
            'job_name': job_name,
            'bucket': bucket,
            'original_transcript': transcript,
            'translated_text': translated_text,
            'source_language': source_language
        })
    )
    
    return {'statusCode': 200, 'body': 'Translation done, Bedrock triggered'}