import { Kafka } from 'kafkajs';

const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID ?? 'neuron';
const KAFKA_BROKERS = process.env.KAFKA_BROKERS ?? '';
const KAFKA_USERNAME = process.env.KAFKA_USERNAME;
const KAFKA_PASSWORD = process.env.KAFKA_PASSWORD;

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
  TRANSACTIONS:
    process.env.KAFKA_TRANSACTIONS_TOPIC_NAME ?? 'neuron_transactions',
  NODE_CHANGES:
    process.env.KAFKA_NODE_CHANGES_TOPIC_NAME ?? 'neuron_node_changes',
  UPDATE_CHANGES:
    process.env.KAFKA_UPDATE_CHANGES_TOPIC_NAME ?? 'neuron_update_changes',
};

export const CONSUMER_IDS = {
  TRANSACTIONS:
    process.env.KAFKA_TRANSACTIONS_CONSUMER_ID ??
    'neuron_transactions_consumer',
  NODE_CHANGES:
    process.env.KAFKA_NODE_CHANGES_CONSUMER_ID ??
    'neuron_node_changes_consumer',
  UPDATE_CHANGES:
    process.env.KAFKA_UPDATE_CHANGES_CONSUMER_ID ??
    'neuron_update_changes_consumer',
};

const connectProducer = async () => {
  await producer.connect();
  console.log('Kafka Producer connected');
};

connectProducer().catch((err) => {
  console.error('Failed to connect Kafka Producer', err);
});
