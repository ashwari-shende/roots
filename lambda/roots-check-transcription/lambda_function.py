#Triggered by new JSON file appearing in transcriptions/ folder
#of S3 bucket (Transcribe finished). Pulls plain text out from
#JSON and calls roots-translate/lambda_function.

import boto3
import urllib.parse
import json

s3 = boto3.client('s3')
lambda_client = boto3.client('lambda')

def lambda_handler(event, context):
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
    
    # Read the transcription result from S3
    response = s3.get_object(Bucket=bucket, Key=key)
    transcript_data = json.loads(response['Body'].read().decode('utf-8'))
    
    # Extract the plain text
    transcript_text = transcript_data['results']['transcripts'][0]['transcript']
    job_name = key.replace('transcriptions/', '').replace('.json', '')
    
    print(f"Transcript for {job_name}: {transcript_text[:100]}...")
    
    # Trigger the translate Lambda
    lambda_client.invoke(
        FunctionName='roots-translate',
        InvocationType='Event',  # async
        Payload=json.dumps({
            'job_name': job_name,
            'bucket': bucket,
            'transcript': transcript_text
        })
    )
    
    return {'statusCode': 200, 'body': 'Transcription read, translation triggered'}