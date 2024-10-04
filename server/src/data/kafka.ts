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
  NODE_CDC: process.env.KAFKA_NODE_CDC_TOPIC_NAME ?? 'neuron_node_cdc',
  NODE_COLLABORATOR_CDC:
    process.env.KAFKA_NODE_COLLABORATOR_CDC_TOPIC_NAME ??
    'neuron_node_collaborator_cdc',
  NODE_REACTION_CDC:
    process.env.KAFKA_NODE_REACTION_CDC_TOPIC_NAME ??
    'neuron_node_reaction_cdc',
  CHANGE_CDC: process.env.KAFKA_CHANGE_CDC_TOPIC_NAME ?? 'neuron_change_cdc',
};

export const CONSUMER_IDS = {
  NODE_CDC:
    process.env.KAFKA_NODE_CDC_CONSUMER_ID ?? 'neuron_node_cdc_consumer',
  NODE_COLLABORATOR_CDC:
    process.env.KAFKA_NODE_COLLABORATOR_CDC_CONSUMER_ID ??
    'neuron_node_collaborator_cdc_consumer',
  NODE_REACTION_CDC:
    process.env.KAFKA_NODE_REACTION_CDC_CONSUMER_ID ??
    'neuron_node_reaction_cdc_consumer',
  CHANGE_CDC:
    process.env.KAFKA_CHANGE_CDC_CONSUMER_ID ?? 'neuron_change_cdc_consumer',
};

const connectProducer = async () => {
  await producer.connect();
  console.log('Kafka Producer connected');
};

connectProducer().catch((err) => {
  console.error('Failed to connect Kafka Producer', err);
});
