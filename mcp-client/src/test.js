const { handler } = require('./index');

// Simulate SQS event
const mockEvent = {
    Records: [
        {
            messageId: "test-123",
            body: JSON.stringify({
                action: "add 5 and 3"
            })
        }
    ]
};

async function test() {
    try {
        const result = await handler(mockEvent);
        console.log('Success:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

test();