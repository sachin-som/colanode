import { syncService } from '@/main/services/sync-service';
import { JobHandler } from '@/main/jobs';

export type InitSynchronizersInput = {
  type: 'init_synchronizers';
  userId: string;
};

declare module '@/main/jobs' {
  interface JobMap {
    init_synchronizers: {
      input: InitSynchronizersInput;
    };
  }
}

export class InitSynchronizersJobHandler
  implements JobHandler<InitSynchronizersInput>
{
  public triggerDebounce = 100;
  public interval = 1000 * 60;

  public async handleJob(input: InitSynchronizersInput) {
    syncService.initSynchronizers(input.userId);
  }
}
