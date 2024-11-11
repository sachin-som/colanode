import { database } from '@/data/database';
import { redisConfig } from '@/data/redis';
import {
  CleanDeviceDataTask,
  CleanUserDeviceNodesTask,
  SendEmailTask,
  Task,
} from '@/types/tasks';
import { Job, Queue, Worker } from 'bullmq';
import { sendEmail } from '@/services/email';

const taskQueue = new Queue('tasks', {
  connection: {
    host: redisConfig.host,
    password: redisConfig.password,
    port: redisConfig.port,
    db: redisConfig.db,
  },
  defaultJobOptions: {
    removeOnComplete: true,
  },
});

export const enqueueTask = async (task: Task): Promise<void> => {
  await taskQueue.add('task', task);
};

export const initTaskWorker = () => {
  return new Worker('tasks', handleTaskJob, {
    connection: {
      host: redisConfig.host,
      password: redisConfig.password,
      port: redisConfig.port,
      db: redisConfig.db,
    },
  });
};

const handleTaskJob = async (job: Job) => {
  const task = job.data as Task;

  switch (task.type) {
    case 'clean_device_data':
      return handleCleanDeviceDataTask(task);
    case 'send_email':
      return handleSendEmailTask(task);
    case 'clean_user_device_nodes':
      return handleCleanUserDeviceNodesTask(task);
  }
};

const handleCleanDeviceDataTask = async (
  task: CleanDeviceDataTask
): Promise<void> => {
  const device = await database
    .selectFrom('devices')
    .where('id', '=', task.deviceId)
    .selectAll()
    .executeTakeFirst();

  if (device) {
    //device is still active
    return;
  }

  await database
    .deleteFrom('device_nodes')
    .where('device_id', '=', task.deviceId)
    .execute();
};

const handleSendEmailTask = async (task: SendEmailTask): Promise<void> => {
  await sendEmail(task.message);
};

const handleCleanUserDeviceNodesTask = async (
  task: CleanUserDeviceNodesTask
): Promise<void> => {
  const workspaceUser = await database
    .selectFrom('workspace_users')
    .where('id', '=', task.userId)
    .where('workspace_id', '=', task.workspaceId)
    .selectAll()
    .executeTakeFirst();

  if (!workspaceUser) {
    return;
  }

  const devices = await database
    .selectFrom('devices')
    .select('id')
    .where('account_id', '=', task.userId)
    .execute();

  if (devices.length === 0) {
    return;
  }

  const deviceIds = devices.map((d) => d.id);

  await database
    .deleteFrom('device_nodes')
    .where('device_id', 'in', deviceIds)
    .where('user_id', '=', task.userId)
    .execute();
};
