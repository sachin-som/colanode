import { Job, JobsOptions, Queue, Worker } from 'bullmq';

import { configuration } from '@/lib/configuration';
import { jobHandlerMap } from '@/jobs';
import { JobHandler, JobInput } from '@/types/jobs';

class JobService {
  private jobQueue: Queue | undefined;
  private jobWorker: Worker | undefined;

  public initQueue() {
    if (this.jobQueue) {
      return;
    }

    this.jobQueue = new Queue(configuration.redis.jobsQueueName, {
      connection: {
        host: configuration.redis.host,
        password: configuration.redis.password,
        port: configuration.redis.port,
        db: configuration.redis.db,
      },
      defaultJobOptions: {
        removeOnComplete: true,
      },
    });
  }

  public async initWorker() {
    if (this.jobWorker) {
      return;
    }

    this.jobWorker = new Worker(
      configuration.redis.jobsQueueName,
      this.handleJobJob,
      {
        connection: {
          host: configuration.redis.host,
          password: configuration.redis.password,
          port: configuration.redis.port,
          db: configuration.redis.db,
        },
      }
    );
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
