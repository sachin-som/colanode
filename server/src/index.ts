import { initApi } from '@/api';
import { initRedis } from '@/data/redis';
import { initNodeChangesConsumer } from '@/consumers/node-cdc';
import { initChangeCdcConsumer } from '@/consumers/change-cdc';
import { initChangesSubscriber } from '@/consumers/mutations';
import { initNodeCollaboratorChangesConsumer } from '@/consumers/node-collaborator-cdc';
import { initNodeReactionChangesConsumer } from '@/consumers/node-reaction-cdc';
import { migrate } from '@/data/database';

migrate().then(() => {
  initApi();

  initNodeChangesConsumer().then(() => {
    console.log('Node cdc consumer started');
  });

  initNodeCollaboratorChangesConsumer().then(() => {
    console.log('Node collaborator cdc consumer started');
  });

  initNodeReactionChangesConsumer().then(() => {
    console.log('Node reaction cdc consumer started');
  });

  initChangeCdcConsumer().then(() => {
    console.log('Change cdc consumer started');
  });

  initRedis().then(() => {
    console.log('Redis initialized');
    initChangesSubscriber().then(() => {
      console.log('Change subscriber started');
    });
  });
});
