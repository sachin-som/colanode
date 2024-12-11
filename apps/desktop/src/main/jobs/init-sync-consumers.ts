import { syncService } from '@/main/services/sync-service';
import { JobHandler } from '@/main/jobs';

export type InitSyncConsumersInput = {
  type: 'init_sync_consumers';
  accountId: string;
  userId: string;
};

declare module '@/main/jobs' {
  interface JobMap {
    init_sync_consumers: {
      input: InitSyncConsumersInput;
    };
  }
}

export class InitSyncConsumersJobHandler
  implements JobHandler<InitSyncConsumersInput>
{
  public triggerDebounce = 100;
  public interval = 1000 * 60;

  public async handleJob(input: InitSyncConsumersInput) {
    syncService.initUserConsumers(input.accountId, input.userId);
  }
}
