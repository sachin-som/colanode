import { databaseService } from '@/main/data/database-service';
import { createDebugger } from '@/main/debugger';
import { socketService } from '@/main/services/socket-service';
import { JobHandler } from '@/main/jobs';

export type ConnectSocketInput = {
  type: 'connect_socket';
  accountId: string;
};

declare module '@/main/jobs' {
  interface JobMap {
    connect_socket: {
      input: ConnectSocketInput;
    };
  }
}

export class ConnectSocketJobHandler implements JobHandler<ConnectSocketInput> {
  public triggerDebounce = 0;
  public interval = 1000 * 60;

  private readonly debug = createDebugger('job:connect-socket');

  public async handleJob(input: ConnectSocketInput) {
    const account = await databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', input.accountId)
      .executeTakeFirst();

    if (!account) {
      this.debug(`Account ${input.accountId} not found`);
      return;
    }

    this.debug(`Connecting to socket for account ${account.email}`);
    socketService.checkConnection(account);
  }
}
