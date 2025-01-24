import dotenv from 'dotenv';

import { eventBus } from '@/lib/event-bus';
import { initApp } from '@/app';
import { migrate } from '@/data/database';
import { initRedis } from '@/data/redis';
import { jobService } from '@/services/job-service';
import { emailService } from '@/services/email-service';

dotenv.config();

const init = async () => {
  await migrate();
  await initRedis();
  await initApp();

  jobService.initQueue();
  await jobService.initWorker();

  await eventBus.init();
  await emailService.init();
};

init();
