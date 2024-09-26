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
  NODE_CHANGES:
    process.env.KAFKA_NODE_CHANGES_TOPIC_NAME ?? 'neuron_node_changes',
  NODE_REACTION_CHANGES:
    process.env.KAFKA_NODE_REACTION_CHANGES_TOPIC_NAME ??
    'neuron_node_reaction_changes',
  MUTATION_CHANGES:
    process.env.KAFKA_MUTATION_CHANGES_TOPIC_NAME ?? 'neuron_mutation_changes',
};

export const CONSUMER_IDS = {
  NODE_CHANGES:
    process.env.KAFKA_NODE_CHANGES_CONSUMER_ID ??
    'neuron_node_changes_consumer',
  NODE_REACTION_CHANGES:
    process.env.KAFKA_NODE_REACTION_CHANGES_CONSUMER_ID ??
    'neuron_node_reaction_changes_consumer',
  MUTATION_CHANGES:
    process.env.KAFKA_MUTATION_CHANGES_CONSUMER_ID ??
    'neuron_mutation_changes_consumer',
};

const connectProducer = async () => {
  await producer.connect();
  console.log('Kafka Producer connected');
};

connectProducer().catch((err) => {
  console.error('Failed to connect Kafka Producer', err);
});
