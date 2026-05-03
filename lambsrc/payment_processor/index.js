const mysql = require('mysql2/promise');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'orders',
};

const eventBridge = new EventBridgeClient();
const sns = new SNSClient();

exports.handler = async (event) => {
  console.log('SQS event:', JSON.stringify(event));

  const connection = await mysql.createConnection(dbConfig);

  try {
    for (const record of event.Records) {
      const body = JSON.parse(record.body);
      const { orderId, customerId } = body;

      console.log(`Processing payment for order ${orderId}`);

      await connection.execute(
        'UPDATE orders SET status = ?, paid_at = NOW() WHERE id = ?',
        ['PAID', orderId]
      );

      const detail = {
        orderId,
        customerId,
        status: 'PAID'
      };

      const ebCmd = new PutEventsCommand({
        Entries: [
          {
            Source: 'orders.payment',
            DetailType: 'OrderPaid',
            Detail: JSON.stringify(detail),
            EventBusName: process.env.EVENT_BUS_NAME
          }
        ]
      });

      await eventBridge.send(ebCmd);

      const snsCmd = new PublishCommand({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Subject: `Order ${orderId} paid`,
        Message: `Order ${orderId} for customer ${customerId} has been paid.`
      });

      await sns.send(snsCmd);
    }

    return { statusCode: 200 };
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    await connection.end();
  }
};
