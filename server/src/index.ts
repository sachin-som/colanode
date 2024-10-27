import { initApi } from '@/api';
import { initRedis } from '@/data/redis';
import { initChangesSubscriber } from '@/consumers/changes-subcriber';
import { migrate } from '@/data/database';
import { initEventWorker } from '@/queues/events';
import { initTaskWorker } from '@/queues/tasks';

migrate().then(() => {
  initApi();

  initRedis().then(() => {
    console.log('Redis initialized');

    initEventWorker();
    initTaskWorker();

    initChangesSubscriber().then(() => {
      console.log('Change subscriber started');
    });
  });
});
