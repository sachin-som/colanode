import { Job, JobsOptions, Queue, Worker } from 'bullmq';

import { configuration } from '@/lib/configuration';
import { jobHandlerMap } from '@/jobs';
import { JobHandler, JobInput } from '@/types/jobs';
import { createLogger } from '@/lib/logger';

const logger = createLogger('job-service');

class JobService {
  private jobQueue: Queue | undefined;
  private jobWorker: Worker | undefined;

  // Bullmq performs atomic operations across different keys, which can cause
  // issues with Redis clusters, so we wrap the queue name in curly braces to
  // ensure that all keys are in the same slot (Redis node)

  // for more information, see: https://docs.bullmq.io/bull/patterns/redis-cluster

  private readonly queueName = `{${configuration.redis.jobsQueueName}}`;

  public initQueue() {
    if (this.jobQueue) {
      return;
    }

    this.jobQueue = new Queue(this.queueName, {
      connection: {
        db: configuration.redis.db,
        url: configuration.redis.url,
      },
      defaultJobOptions: {
        removeOnComplete: true,
      },
    });

    this.jobQueue.on('error', (error) => {
      logger.error(error, 'Job queue error');
    });
  }

  public async initWorker() {
    if (this.jobWorker) {
      return;
    }

    this.jobWorker = new Worker(this.queueName, this.handleJobJob, {
      connection: {
        url: configuration.redis.url,
        db: configuration.redis.db,
      },
    });
  }

  public async addJob(job: JobInput, options?: JobsOptions) {
    if (!this.jobQueue) {
      throw new Error('Job queue not initialized.');
    }

    await this.jobQueue.add(job.type, job, options);
  }

  private handleJobJob = async (job: Job) => {
    const input = job.data as JobInput;
    const handler = jobHandlerMap[input.type] as JobHandler<typeof input>;
    await handler(input);
  };
}

export const jobService = new JobService();
