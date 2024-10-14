import { initApi } from '@/api';
import { initRedis } from '@/data/redis';
import { initChangesSubscriber } from '@/consumers/changes-subcriber';
import { migrate } from '@/data/database';
import { initChangeWorker } from '@/queues/changes';

migrate().then(() => {
  initApi();

  initRedis().then(() => {
    console.log('Redis initialized');

    initChangeWorker();

    initChangesSubscriber().then(() => {
      console.log('Change subscriber started');
    });
  });
});
