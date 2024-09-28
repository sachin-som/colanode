import { initApi } from '@/api';
import { initRedis } from '@/data/redis';
import { initNodeChangesConsumer } from '@/consumers/node-changes';
import { initMutationChangesConsumer } from '@/consumers/mutation-changes';
import { initMutationsSubscriber } from '@/consumers/mutations';
import { initNodeCollaboratorChangesConsumer } from '@/consumers/node-collaborator-changes';
import { initNodeReactionChangesConsumer } from '@/consumers/node-reaction-changes';
import { migrate } from '@/data/database';

migrate().then(() => {
  initApi();

  initNodeChangesConsumer().then(() => {
    console.log('Node changes consumer started');
  });

  initNodeCollaboratorChangesConsumer().then(() => {
    console.log('Node collaborator change consumer started');
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
