import boto3
import urllib.parse
import json
import urllib.request
import urllib.error

ASSEMBLYAI_KEY = "paste_api_key"

s3 = boto3.client('s3')
lambda_client = boto3.client('lambda')

def lambda_handler(event, context):
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
    job_name = key.replace('recordings/', '').replace('.webm', '').replace('.mp3', '')

    # Download audio from S3
    s3_response = s3.get_object(Bucket=bucket, Key=key)
    audio_data = s3_response['Body'].read()
    print(f"Downloaded {len(audio_data)} bytes from S3")

    # Upload to AssemblyAI
    upload_req = urllib.request.Request(
        'assemblyai.url',
        data=audio_data,
        headers={
            'authorization': ASSEMBLYAI_KEY,
            'content-type': 'application/octet-stream'
        }
    )
    upload_response = urllib.request.urlopen(upload_req)
    upload_url = json.loads(upload_response.read())['upload_url']
    print(f"Uploaded to AssemblyAI: {upload_url}")

    # Submit transcript job
    try:
        #request_data = json.dumps({'audio_url': upload_url}).encode('utf-8')
        request_data = json.dumps({
            'audio_url': upload_url,
            'speech_models': ['universal-2']
        }).encode('utf-8')
        req = urllib.request.Request(
            'assemblyai.url',
            data=request_data,
            headers={
                'authorization': ASSEMBLYAI_KEY,
                'content-type': 'application/json'
            }
        )
        response = urllib.request.urlopen(req)
        transcript_id = json.loads(response.read())['id']
        print(f"AssemblyAI job started: {transcript_id}")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"AssemblyAI error {e.code}: {error_body}")
        raise

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
