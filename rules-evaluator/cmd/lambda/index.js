const axios = require('axios');
const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        // Process SQS records
        

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Messages processed successfully',
                processedCount: event.Records.length
            })
        };
    } catch (error) {
        console.error('Error:', error);
        throw error; // Let Lambda retry the batch
    }
};