const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const sqs = new SQSClient();

exports.handler = async (event) => {
  console.log('OrderCreated event:', JSON.stringify(event));

  const messages = [];

  if (event.detail) {
    messages.push(event.detail);
  }

  for (const msg of messages) {
    const payload = {
      orderId: msg.orderId,
      customerId: msg.customerId,
      items: msg.items
    };

    const cmd = new SendMessageCommand({
      QueueUrl: process.env.PAYMENT_QUEUE_URL,
      MessageBody: JSON.stringify(payload)
    });

    await sqs.send(cmd);
  }

  return { statusCode: 200 };
};
