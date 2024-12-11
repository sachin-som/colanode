import { accountService } from '@/main/services/account-service';
import { JobHandler } from '@/main/jobs';

export type SyncAccountInput = {
  type: 'sync_account';
  accountId: string;
};

declare module '@/main/jobs' {
  interface JobMap {
    sync_account: {
      input: SyncAccountInput;
    };
  }
}

export class SyncAccountJobHandler implements JobHandler<SyncAccountInput> {
  public triggerDebounce = 0;
  public interval = 1000 * 60;

  public async handleJob(input: SyncAccountInput) {
    await accountService.syncAccount(input.accountId);
  }
}
