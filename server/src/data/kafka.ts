import { Kafka } from 'kafkajs';

const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID ?? 'neuron';
const KAFKA_BROKERS = process.env.KAFKA_BROKERS ?? '';
const KAFKA_USERNAME = process.env.KAFKA_USERNAME;
const KAFKA_PASSWORD = process.env.KAFKA_PASSWORD;
const KAFKA_TRANSACTIONS_TOPIC_NAME =
  process.env.KAFKA_TRANSACTIONS_TOPIC_NAME ?? 'neuron_transactions';
export const KAFKA_CONSUMER_GROUP =
  process.env.KAFKA_CONSUMER_GROUP ?? 'neuron';

export const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKERS.split(','),
  sasl:
    KAFKA_USERNAME && KAFKA_PASSWORD
      ? {
          username: KAFKA_USERNAME,
          password: KAFKA_PASSWORD,
          mechanism: 'plain',
        }
      : undefined,
});

export const producer = kafka.producer();

export const TOPIC_NAMES = {
  TRANSACTIONS: KAFKA_TRANSACTIONS_TOPIC_NAME,
};

const connectProducer = async () => {
  await producer.connect();
  console.log('Kafka Producer connected');
};

connectProducer().catch((err) => {
  console.error('Failed to connect Kafka Producer', err);
});
