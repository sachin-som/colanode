import { initApi } from '@/api';
import { initRedis } from '@/data/redis';
import { migrate } from '@/data/database';
import { initEventWorker } from '@/queues/events';
import { initTaskWorker } from '@/queues/tasks';
import { initEmail } from './services/email';
import dotenv from 'dotenv';

dotenv.config();

const init = async () => {
  await migrate();
  await initRedis();
  await initEmail();
  await initApi();

  initEventWorker();
  initTaskWorker();
};

init();