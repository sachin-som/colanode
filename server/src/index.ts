import { initApi } from '@/api';
import { initRedis } from '@/data/redis';
import { initNodeChangesConsumer } from '@/consumers/node-changes';
import { initMutationChangesConsumer } from '@/consumers/mutation-changes';
import { initMutationsSubscriber } from '@/consumers/mutations';
import { initNodePermissionChangesConsumer } from '@/consumers/node-permission-changes';
import { initNodeReactionChangesConsumer } from '@/consumers/node-reaction-changes';
import { migrate } from '@/data/database';

migrate().then(() => {
  initApi();

  initNodeChangesConsumer().then(() => {
    console.log('Node changes consumer started');
  });

  initNodePermissionChangesConsumer().then(() => {
    console.log('Node permission change consumer started');
  });

  initNodeReactionChangesConsumer().then(() => {
    console.log('Node reaction change consumer started');
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
