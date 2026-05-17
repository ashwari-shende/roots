#Retrieves stories from DynamoDB so they can be displayed in pop-up
#when user clicks on person in the community archive page.

import boto3
import json

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('roots-stories')

def lambda_handler(event, context):
    response = table.scan()
    stories = response['Items']
    
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(stories)
    }