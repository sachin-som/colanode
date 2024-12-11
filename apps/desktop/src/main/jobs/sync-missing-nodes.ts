import { GetTransactionsOutput } from '@colanode/core';

import { nodeService } from '@/main/services/node-service';
import { fetchCursor, fetchWorkspaceCredentials } from '@/main/utils';
import { createDebugger } from '@/main/debugger';
import { databaseService } from '@/main/data/database-service';
import { serverService } from '@/main/services/server-service';
import { JobHandler } from '@/main/jobs';
import { httpClient } from '@/shared/lib/http-client';

export type SyncMissingNodesInput = {
  type: 'sync_missing_nodes';
  userId: string;
};

declare module '@/main/jobs' {
  interface JobMap {
    sync_missing_nodes: {
      input: SyncMissingNodesInput;
    };
  }
}

export class SyncMissingNodesJobHandler
  implements JobHandler<SyncMissingNodesInput>
{
  public triggerDebounce = 100;
  public interval = 1000 * 60;

  private readonly debug = createDebugger('job:sync-missing-nodes');

  public async handleJob(input: SyncMissingNodesInput) {
    this.debug(`Syncing missing nodes for user ${input.userId}`);

    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const missingNodes = await workspaceDatabase
      .selectFrom('collaborations')
      .leftJoin('nodes', 'collaborations.node_id', 'nodes.id')
      .select('collaborations.node_id')
      .where('nodes.id', 'is', null)
      .execute();

    if (missingNodes.length === 0) {
      this.debug(`No missing nodes found for user ${input.userId}, skipping`);
      return;
    }

    const credentials = await fetchWorkspaceCredentials(input.userId);
    if (!credentials) {
      this.debug(
        `No workspace credentials found for user ${input.userId}, skipping`
      );
      return;
    }

    if (!serverService.isAvailable(credentials.serverDomain)) {
      this.debug(
        `Server ${credentials.serverDomain} is not available, skipping`
      );
      return;
    }

    for (const node of missingNodes) {
      try {
        this.debug(
          `Syncing missing node ${node.node_id} for user ${input.userId}`
        );

        const { data } = await httpClient.get<GetTransactionsOutput>(
          `/v1/workspaces/${credentials.workspaceId}/transactions/${node.node_id}`,
          {
            domain: credentials.serverDomain,
            token: credentials.token,
          }
        );

        const cursor = await fetchCursor(input.userId, 'transactions');
        await nodeService.replaceTransactions(
          input.userId,
          node.node_id,
          data.transactions,
          cursor
        );
      } catch (error) {
        this.debug(
          error,
          `Error syncing missing node ${node.node_id} for user ${input.userId}`
        );
      }
    }
  }
}
