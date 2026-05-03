const mysql = require('mysql2/promise');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'orders',
};

const eventBridge = new EventBridgeClient();

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event));

  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
  const { customerId, items } = body;

  if (!customerId || !Array.isArray(items) || items.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'customerId and items are required' }),
    };
  }

  const connection = await mysql.createConnection(dbConfig);

  try {
    await connection.beginTransaction();

    const [orderResult] = await connection.execute(
      'INSERT INTO orders (customer_id, status, created_at) VALUES (?, ?, NOW())',
      [customerId, 'PENDING_PAYMENT']
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      await connection.execute(
        'INSERT INTO order_items (order_id, sku, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.sku, item.quantity, item.price]
      );
    }

    await connection.commit();

    const detail = {
      orderId,
      customerId,
      items,
      status: 'PENDING_PAYMENT',
    };

    const cmd = new PutEventsCommand({
      Entries: [
        {
          Source: 'orders.api',
          DetailType: 'OrderCreated',
          Detail: JSON.stringify(detail),
          EventBusName: process.env.EVENT_BUS_NAME,
        },
      ],
    });

    await eventBridge.send(cmd);

    return {
      statusCode: 201,
      body: JSON.stringify({ orderId, status: 'PENDING_PAYMENT' }),
    };
  } catch (err) {
    console.error(err);
    await connection.rollback();
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create order' }),
    };
  } finally {
    await connection.end();
  }
};
