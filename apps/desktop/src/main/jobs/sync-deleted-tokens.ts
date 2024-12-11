import { serverService } from '@/main/services/server-service';
import { createDebugger } from '@/main/debugger';
import { databaseService } from '@/main/data/database-service';
import { JobHandler } from '@/main/jobs';
import { httpClient } from '@/shared/lib/http-client';

export type SyncDeletedTokensInput = {
  type: 'sync_deleted_tokens';
};

declare module '@/main/jobs' {
  interface JobMap {
    sync_deleted_tokens: {
      input: SyncDeletedTokensInput;
    };
  }
}

export class SyncDeletedTokensJobHandler
  implements JobHandler<SyncDeletedTokensInput>
{
  public triggerDebounce = 100;
  public interval = 1000 * 60 * 5;

  private readonly debug = createDebugger('job:sync-deleted-tokens');

  public async handleJob(_: SyncDeletedTokensInput) {
    this.debug('Syncing deleted tokens');

    const deletedTokens = await databaseService.appDatabase
      .selectFrom('deleted_tokens')
      .innerJoin('servers', 'deleted_tokens.server', 'servers.domain')
      .select([
        'deleted_tokens.token',
        'deleted_tokens.account_id',
        'servers.domain',
        'servers.attributes',
      ])
      .execute();

    if (deletedTokens.length === 0) {
      this.debug('No deleted tokens found');
      return;
    }

    for (const deletedToken of deletedTokens) {
      if (!serverService.isAvailable(deletedToken.domain)) {
        this.debug(
          `Server ${deletedToken.domain} is not available for logging out account ${deletedToken.account_id}`
        );
        continue;
      }

      try {
        const { status } = await httpClient.delete(`/v1/accounts/logout`, {
          domain: deletedToken.domain,
          token: deletedToken.token,
        });

        this.debug(`Deleted token logout response status code: ${status}`);

        if (status !== 200) {
          return;
        }

        await databaseService.appDatabase
          .deleteFrom('deleted_tokens')
          .where('token', '=', deletedToken.token)
          .where('account_id', '=', deletedToken.account_id)
          .execute();

        this.debug(
          `Logged out account ${deletedToken.account_id} from server ${deletedToken.domain}`
        );
      } catch (error) {
        this.debug(
          `Failed to logout account ${deletedToken.account_id} from server ${deletedToken.domain}`,
          error
        );
      }
    }
  }
}
