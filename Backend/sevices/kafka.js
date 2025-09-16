// backend/services/kafka.js
import { Kafka } from 'kafkajs';

let kafka;
let producer;
let consumer;

export const initKafka = async () => {
  try {
    kafka = new Kafka({
      clientId: 'xeno-crm',
      brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
    });

    producer = kafka.producer();
    consumer = kafka.consumer({ groupId: 'xeno-crm-group' });

    await producer.connect();
    await consumer.connect();

    // Subscribe to topics
    await consumer.subscribe({ topic: 'customer-ingestion', fromBeginning: true });
    await consumer.subscribe({ topic: 'campaign-delivery', fromBeginning: true });

    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          
          switch (topic) {
            case 'customer-ingestion':
              await handleCustomerIngestion(data);
              break;
            case 'campaign-delivery':
              await handleCampaignDelivery(data);
              break;
          }
        } catch (error) {
          console.error(`Error processing message from topic ${topic}:`, error);
        }
      },
    });

    console.log('Kafka connected successfully');
  } catch (error) {
    console.error('Error connecting to Kafka:', error);
  }
};

export const produceMessage = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  } catch (error) {
    console.error('Error producing message to Kafka:', error);
    throw error;
  }
};

const handleCustomerIngestion = async (data) => {
  try {
    const Customer = (await import('../models/Customer.js')).default;
    
    if (data.type === 'CREATE_CUSTOMER') {
      // Check if customer already exists
      const existingCustomer = await Customer.findOne({ email: data.data.email });
      
      if (!existingCustomer) {
        const customer = new Customer(data.data);
        await customer.save();
        console.log('Customer created via Kafka:', customer.email);
      }
    }
  } catch (error) {
    console.error('Error handling customer ingestion:', error);
  }
};

const handleCampaignDelivery = async (data) => {
  try {
    const CommunicationLog = (await import('../models/CommunicationLog.js')).default;
    
    if (data.type === 'SEND_MESSAGE') {
      // Simulate sending message (90% success rate)
      const success = Math.random() < 0.9;
      
      const log = new CommunicationLog({
        campaignId: data.campaignId,
        customerId: data.customerId,
        message: data.message,
        status: success ? 'sent' : 'failed',
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sentAt: new Date(),
        failureReason: success ? undefined : 'Simulated failure',
      });
      
      await log.save();
      
      // Update campaign stats
      const Campaign = (await import('../models/Campaign.js')).default;
      await Campaign.findByIdAndUpdate(data.campaignId, {
        $inc: {
          'stats.total': 1,
          'stats.sent': success ? 1 : 0,
          'stats.failed': success ? 0 : 1,
        },
      });
      
      console.log(`Message ${success ? 'sent' : 'failed'} for customer:`, data.customerId);
    }
  } catch (error) {
    console.error('Error handling campaign delivery:', error);
  }
};