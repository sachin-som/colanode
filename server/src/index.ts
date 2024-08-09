import { initApi } from '@/api';
import { initRedis } from '@/data/redis';
import { initTransactionsConsumer } from '@/consumers/transactions';
import { initNodeChangesConsumer } from '@/consumers/node-changes';
import { initUpdateChangesConsumer } from '@/consumers/update-changes';
import { initUpdatesSubscriber } from '@/consumers/updates';

initApi();
initTransactionsConsumer().then(() => {
  console.log('Transactions consumer started');
});
initNodeChangesConsumer().then(() => {
  console.log('Node changes consumer started');
});
initUpdateChangesConsumer().then(() => {
  console.log('Update changes consumer started');
});

initRedis().then(() => {
  console.log('Redis initialized');
  // initUpdatesSubscriber().then(() => {
  //   console.log('Updates subscriber started');
  // });
});
