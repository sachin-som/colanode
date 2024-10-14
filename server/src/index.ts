import { initApi } from '@/api';
import { initRedis } from '@/data/redis';
import { initChangesSubscriber } from '@/consumers/changes-subcriber';
import { migrate } from '@/data/database';
import { initChangeWorker } from '@/queues/changes';
import { initSyncWorker } from '@/queues/sync';

migrate().then(() => {
  initApi();

  initRedis().then(() => {
    console.log('Redis initialized');

    initChangeWorker();
    initSyncWorker();

    initChangesSubscriber().then(() => {
      console.log('Change subscriber started');
    });
  });
});
