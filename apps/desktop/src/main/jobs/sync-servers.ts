import { serverService } from '@/main/services/server-service';
import { JobHandler } from '@/main/jobs';

export type SyncServersInput = {
  type: 'sync_servers';
};

declare module '@/main/jobs' {
  interface JobMap {
    sync_servers: {
      input: SyncServersInput;
    };
  }
}

export class SyncServersJobHandler implements JobHandler<SyncServersInput> {
  public triggerDebounce = 0;
  public interval = 1000 * 60;

  public async handleJob(_: SyncServersInput) {
    await serverService.syncServers();
  }
}
