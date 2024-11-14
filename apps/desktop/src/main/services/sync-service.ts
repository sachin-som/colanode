import { httpClient } from '@/shared/lib/http-client';
import { databaseService } from '@/main/data/database-service';
import { LocalChange, SyncChangesOutput } from '@colanode/core';
import {
  SelectChange,
  WorkspaceDatabaseSchema,
} from '@/main/data/workspace/schema';
import { Kysely } from 'kysely';
import { eventBus } from '@/shared/lib/event-bus';

type SyncState = {
  isSyncing: boolean;
  scheduledSync: boolean;
};

class SyncService {
  private initiated: boolean = false;
  private syncStates: Map<string, SyncState> = new Map();

  constructor() {
    eventBus.subscribe((event) => {
      if (event.type === 'change_created') {
        this.syncWorkspace(event.userId);
      }
    });
  }

  public init() {
    if (this.initiated) {
      return;
    }

    this.initiated = true;
    this.syncAllWorkspaces();
  }

  private async syncAllWorkspaces() {
    const workspaces = await databaseService.appDatabase
      .selectFrom('workspaces')
      .select(['user_id'])
      .execute();

    for (const workspace of workspaces) {
      this.syncWorkspace(workspace.user_id);
    }
  }

  public async syncWorkspace(userId: string) {
    if (!this.syncStates.has(userId)) {
      this.syncStates.set(userId, {
        isSyncing: false,
        scheduledSync: false,
      });
    }

    const syncState = this.syncStates.get(userId)!;
    if (syncState.isSyncing) {
      syncState.scheduledSync = true;
      return;
    }

    syncState.isSyncing = true;
    try {
      await this.syncWorkspaceChanges(userId);
    } catch (error) {
      console.log('error', error);
    } finally {
      syncState.isSyncing = false;

      if (syncState.scheduledSync) {
        syncState.scheduledSync = false;
        this.syncWorkspace(userId);
      }
    }
  }

  // private async syncDeletedTokens() {
  //   const deletedTokens = await databaseService.appDatabase
  //     .selectFrom('deleted_tokens')
  //     .innerJoin('servers', 'deleted_tokens.server', 'servers.domain')
  //     .select([
  //       'deleted_tokens.token',
  //       'deleted_tokens.account_id',
  //       'servers.domain',
  //       'servers.attributes',
  //     ])
  //     .execute();

  //   if (deletedTokens.length === 0) {
  //     return;
  //   }

  //   for (const deletedToken of deletedTokens) {
  //     try {
  //       const { status } = await httpClient.delete(`/v1/accounts/logout`, {
  //         serverDomain: deletedToken.domain,
  //         serverAttributes: deletedToken.attributes,
  //         token: deletedToken.token,
  //       });

  //       if (status !== 200) {
  //         return;
  //       }

  //       await databaseService.appDatabase
  //         .deleteFrom('deleted_tokens')
  //         .where('token', '=', deletedToken.token)
  //         .where('account_id', '=', deletedToken.account_id)
  //         .execute();
  //     } catch (error) {
  //       // console.log('error', error);
  //     }
  //   }
  // }

  private async syncWorkspaceChanges(userId: string) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const changes =
      await this.fetchAndCompactWorkspaceChanges(workspaceDatabase);
    if (changes.length === 0) {
      return;
    }

    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .innerJoin('accounts', 'workspaces.account_id', 'accounts.id')
      .innerJoin('servers', 'accounts.server', 'servers.domain')
      .select([
        'workspaces.workspace_id',
        'workspaces.user_id',
        'workspaces.account_id',
        'accounts.token',
        'servers.domain',
        'servers.attributes',
      ])
      .where('workspaces.user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      return;
    }

    while (changes.length > 0) {
      const changesToSync = changes.splice(0, 20);
      const { data } = await httpClient.post<SyncChangesOutput>(
        `/v1/sync/${workspace.workspace_id}`,
        {
          changes: changesToSync,
        },
        {
          serverDomain: workspace.domain,
          serverAttributes: workspace.attributes,
          token: workspace.token,
        }
      );

      const syncedChangeIds: number[] = [];
      const unsyncedChangeIds: number[] = [];
      for (const result of data.results) {
        if (result.status === 'success') {
          syncedChangeIds.push(result.id);
        } else {
          unsyncedChangeIds.push(result.id);
        }
      }

      if (syncedChangeIds.length > 0) {
        await workspaceDatabase
          .deleteFrom('changes')
          .where('id', 'in', syncedChangeIds)
          .execute();
      }

      if (unsyncedChangeIds.length > 0) {
        await workspaceDatabase
          .updateTable('changes')
          .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
          .where('id', 'in', unsyncedChangeIds)
          .execute();

        //we just delete changes that have failed to sync for more than 5 times.
        //in the future we might need to revert the change locally.
        await workspaceDatabase
          .deleteFrom('changes')
          .where('retry_count', '>=', 5)
          .execute();
      }
    }
  }

  private async fetchAndCompactWorkspaceChanges(
    database: Kysely<WorkspaceDatabaseSchema>
  ): Promise<LocalChange[]> {
    const changeRows = await database
      .selectFrom('changes')
      .selectAll()
      .orderBy('id asc')
      .limit(1000)
      .execute();

    if (changeRows.length === 0) {
      return [];
    }

    const changes: LocalChange[] = changeRows.map(this.mapChange);
    const changesToDelete = new Set<number>();
    for (let i = changes.length - 1; i >= 0; i--) {
      const change = changes[i];

      if (changesToDelete.has(change.id)) {
        continue;
      }

      if (change.data.type === 'node_delete') {
        for (let j = i - 1; j >= 0; j--) {
          const otherChange = changes[j];
          if (
            otherChange.data.type === 'node_create' &&
            otherChange.data.id === change.data.id
          ) {
            // if the node has been created and then deleted, we don't need to sync the delete
            changesToDelete.add(change.id);
            changesToDelete.add(otherChange.id);
          }

          if (
            otherChange.data.type === 'node_update' &&
            otherChange.data.id === change.data.id
          ) {
            changesToDelete.add(otherChange.id);
          }
        }
      } else if (change.data.type === 'user_node_update') {
        for (let j = i - 1; j >= 0; j--) {
          const otherChange = changes[j];
          if (
            otherChange.data.type === 'user_node_update' &&
            otherChange.data.nodeId === change.data.nodeId &&
            otherChange.data.userId === change.data.userId
          ) {
            changesToDelete.add(otherChange.id);
          }
        }
      }
    }

    if (changesToDelete.size > 0) {
      const toDeleteIds = Array.from(changesToDelete);
      await database
        .deleteFrom('changes')
        .where('id', 'in', toDeleteIds)
        .execute();
    }

    return changes.filter((change) => !changesToDelete.has(change.id));
  }

  private mapChange(change: SelectChange): LocalChange {
    return {
      id: change.id,
      data: JSON.parse(change.data),
      createdAt: change.created_at,
    };
  }
}

export const syncService = new SyncService();
