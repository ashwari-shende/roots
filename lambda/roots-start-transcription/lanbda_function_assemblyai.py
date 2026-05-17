import boto3
import urllib.parse
import json
import urllib.request

ASSEMBLYAI_KEY = "your_assemblyai_key_here"

s3 = boto3.client('s3')
lambda_client = boto3.client('lambda')

def lambda_handler(event, context):
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
    job_name = key.replace('recordings/', '').replace('.webm', '').replace('.mp3', '')

    # Generate presigned URL so AssemblyAI can access the private S3 file
    presigned_url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket, 'Key': key},
        ExpiresIn=3600
    )

    # Submit to AssemblyAI
    request_data = json.dumps({'audio_url': presigned_url}).encode('utf-8')
    req = urllib.request.Request(
        'https://api.assemblyai.com/v2/transcript',
        data=request_data,
        headers={
            'authorization': ASSEMBLYAI_KEY,
            'content-type': 'application/json'
        }
    )
    response = urllib.request.urlopen(req)
    transcript_id = json.loads(response.read())['id']

    print(f"AssemblyAI job started: {transcript_id}")

    # Trigger polling Lambda
    lambda_client.invoke(
        FunctionName='roots-poll-assemblyai',
        InvocationType='Event',
        Payload=json.dumps({
            'job_name': job_name,
            'bucket': bucket,
            'transcript_id': transcript_id
        })
    )

    return {'statusCode': 200, 'body': transcript_id}