import { Mutation, SyncMutationsOutput } from '@colanode/core';

import { fetchWorkspaceCredentials, mapMutation } from '@/main/utils';
import { createDebugger } from '@/main/debugger';
import { databaseService } from '@/main/data/database-service';
import { serverService } from '@/main/services/server-service';
import { JobHandler } from '@/main/jobs';
import { httpClient } from '@/shared/lib/http-client';

export type SyncPendingMutationsInput = {
  type: 'sync_pending_mutations';
  userId: string;
};

declare module '@/main/jobs' {
  interface JobMap {
    sync_pending_mutations: {
      input: SyncPendingMutationsInput;
    };
  }
}

export class SyncPendingMutationsJobHandler
  implements JobHandler<SyncPendingMutationsInput>
{
  public triggerDebounce = 0;
  public interval = 1000 * 60;

  private readonly debug = createDebugger('job:sync-pending-mutations');

  public async handleJob(input: SyncPendingMutationsInput) {
    this.debug(`Sending local pending mutations for user ${input.userId}`);

    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const unsyncedMutations = await workspaceDatabase
      .selectFrom('mutations')
      .selectAll()
      .orderBy('id', 'asc')
      .limit(20)
      .execute();

    if (unsyncedMutations.length === 0) {
      return;
    }

    this.debug(
      `Sending ${unsyncedMutations.length} local pending mutations for user ${input.userId}`
    );

    const credentials = await fetchWorkspaceCredentials(input.userId);
    if (!credentials) {
      this.debug(
        `No workspace credentials found for user ${input.userId}, skipping sending local pending mutations`
      );
      return;
    }

    if (!serverService.isAvailable(credentials.serverDomain)) {
      this.debug(
        `Server ${credentials.serverDomain} is not available, skipping sending local pending mutations`
      );
      return;
    }

    const mutations: Mutation[] = unsyncedMutations.map(mapMutation);
    const { data } = await httpClient.post<SyncMutationsOutput>(
      `/v1/workspaces/${credentials.workspaceId}/mutations`,
      {
        mutations,
      },
      {
        domain: credentials.serverDomain,
        token: credentials.token,
      }
    );

    const syncedMutationIds: string[] = [];
    const unsyncedMutationIds: string[] = [];

    for (const result of data.results) {
      if (result.status === 'success') {
        syncedMutationIds.push(result.id);
      } else {
        unsyncedMutationIds.push(result.id);
      }
    }

    if (syncedMutationIds.length > 0) {
      this.debug(
        `Marking ${syncedMutationIds.length} local pending mutations as sent for user ${input.userId}`
      );

      await workspaceDatabase
        .deleteFrom('mutations')
        .where('id', 'in', syncedMutationIds)
        .execute();
    }

    if (unsyncedMutationIds.length > 0) {
      this.debug(
        `Marking ${unsyncedMutationIds.length} local pending mutations as failed for user ${input.userId}`
      );

      await workspaceDatabase
        .updateTable('mutations')
        .set((eb) => ({ retries: eb('retries', '+', 1) }))
        .where('id', 'in', unsyncedMutationIds)
        .execute();
    }
  }
}
