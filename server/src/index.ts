import { initApi } from '@/api';
import { initRedis } from '@/data/redis';
import { initMutationChangesConsumer } from '@/consumers/mutation-changes';
import { initMutationsSubscriber } from '@/consumers/mutations';

initApi();

initMutationChangesConsumer().then(() => {
  console.log('Mutation changes consumer started');
});

initRedis().then(() => {
  console.log('Redis initialized');
  initMutationsSubscriber().then(() => {
    console.log('Mutation subscriber started');
  });
});
