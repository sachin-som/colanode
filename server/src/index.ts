import { initApi } from '@/api';
import { initRedis } from '@/data/redis';
import { initNodeChangesConsumer } from '@/consumers/node-changes';
import { initMutationChangesConsumer } from '@/consumers/mutation-changes';
import { initMutationsSubscriber } from '@/consumers/mutations';
import { migrate } from './data/database';

migrate().then(() => {
  initApi();

  initNodeChangesConsumer().then(() => {
    console.log('Node changes consumer started');
  });

  initMutationChangesConsumer().then(() => {
    console.log('Mutation changes consumer started');
  });

  initRedis().then(() => {
    console.log('Redis initialized');
    initMutationsSubscriber().then(() => {
      console.log('Mutation subscriber started');
    });
  });
});
