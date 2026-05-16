#Triggered by audio file landing in S3 bucket
#Gives audio file to AWS Transcirbe which converts
#gives the transcript back as a JSON file.
#Saves transcript in transcriptions/ folder in same S3 bucket.

import boto3
import urllib.parse

transcribe = boto3.client('transcribe')

def lambda_handler(event, context):
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
    
    # Use filename as job name (strip folder and extension)
    job_name = key.replace('recordings/', '').replace('.webm', '').replace('.mp3', '')
    
    transcribe.start_transcription_job(
        TranscriptionJobName=job_name,
        Media={'MediaFileUri': f's3://{bucket}/{key}'},
        MediaFormat='webm',
        LanguageCode='en-US',
        OutputBucketName=bucket,
        OutputKey=f'transcriptions/{job_name}.json'
    )
    
    print(f"Started transcription job: {job_name}")
    return {'statusCode': 200, 'body': job_name}