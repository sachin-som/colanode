import { BackoffCalculator } from '@/lib/backoff-calculator';
import { buildAxiosInstance } from '@/lib/servers';
import { databaseManager } from '@/main/data/database-manager';
import {
  ServerChange,
  ServerChangeData,
  ServerSyncResponse,
} from '@/types/sync';
import { mediator } from '@/main/mediator';

const EVENT_LOOP_INTERVAL = 100;

class Synchronizer {
  private initiated: boolean = false;
  private readonly workspaceBackoffs: Map<string, BackoffCalculator> =
    new Map();

  constructor() {
    this.executeEventLoop = this.executeEventLoop.bind(this);
  }

  public init() {
    if (this.initiated) {
      return;
    }

    setTimeout(this.executeEventLoop, 10);
    this.initiated = true;
  }

  private async executeEventLoop() {
    try {
      await this.checkForWorkspaceChanges();
    } catch (error) {
      console.log('error', error);
    }

    setTimeout(this.executeEventLoop, EVENT_LOOP_INTERVAL);
  }

  public async handleServerChange(accountId: string, change: ServerChange) {
    const executed = await this.executeServerChange(accountId, change.data);
    if (executed) {
      await mediator.executeMessage(
        {
          accountId,
          deviceId: change.deviceId,
        },
        {
          type: 'server_change_result',
          changeId: change.id,
          success: executed,
        },
      );
    }
  }

  private async executeServerChange(
    accountId: string,
    data: ServerChangeData,
  ): Promise<boolean> {
    switch (data.type) {
      case 'node_create': {
        const result = await mediator.executeMutation({
          type: 'node_server_create',
          accountId: accountId,
          workspaceId: data.workspaceId,
          id: data.id,
          state: data.state,
          createdAt: data.createdAt,
          serverCreatedAt: data.serverCreatedAt,
          createdBy: data.createdBy,
          versionId: data.versionId,
        });

        return result.success;
      }
      case 'node_update': {
        const result = await mediator.executeMutation({
          type: 'node_server_update',
          accountId: accountId,
          workspaceId: data.workspaceId,
          id: data.id,
          update: data.update,
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy,
          versionId: data.versionId,
          serverUpdatedAt: data.serverUpdatedAt,
        });

        return result.success;
      }
      case 'node_delete': {
        const result = await mediator.executeMutation({
          type: 'node_server_delete',
          accountId: accountId,
          workspaceId: data.workspaceId,
          id: data.id,
        });

        return result.success;
      }
      case 'node_collaborator_create': {
        const result = await mediator.executeMutation({
          type: 'node_collaborator_server_create',
          accountId: accountId,
          workspaceId: data.workspaceId,
          nodeId: data.nodeId,
          collaboratorId: data.collaboratorId,
          role: data.role,
          createdAt: data.createdAt,
          createdBy: data.createdBy,
          versionId: data.versionId,
          serverCreatedAt: data.serverCreatedAt,
        });

        return result.success;
      }
      case 'node_collaborator_update': {
        const result = await mediator.executeMutation({
          type: 'node_collaborator_server_update',
          accountId: accountId,
          workspaceId: data.workspaceId,
          nodeId: data.nodeId,
          collaboratorId: data.collaboratorId,
          role: data.role,
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy,
          versionId: data.versionId,
          serverUpdatedAt: data.serverUpdatedAt,
        });

        return result.success;
      }
      case 'node_collaborator_delete': {
        const result = await mediator.executeMutation({
          type: 'node_collaborator_server_delete',
          accountId: accountId,
          workspaceId: data.workspaceId,
          nodeId: data.nodeId,
          collaboratorId: data.collaboratorId,
        });

        return result.success;
      }
      case 'node_reaction_create': {
        const result = await mediator.executeMutation({
          type: 'node_reaction_server_create',
          accountId: accountId,
          workspaceId: data.workspaceId,
          nodeId: data.nodeId,
          actorId: data.actorId,
          reaction: data.reaction,
          createdAt: data.createdAt,
          serverCreatedAt: data.serverCreatedAt,
        });

        return result.success;
      }
      case 'node_reaction_delete': {
        const result = await mediator.executeMutation({
          type: 'node_reaction_server_delete',
          accountId: accountId,
          workspaceId: data.workspaceId,
          nodeId: data.nodeId,
          actorId: data.actorId,
          reaction: data.reaction,
        });

        return result.success;
      }
      default: {
        return false;
      }
    }
  }

  private async checkForWorkspaceChanges() {
    const workspaces = await databaseManager.appDatabase
      .selectFrom('workspaces')
      .innerJoin('accounts', 'workspaces.account_id', 'accounts.id')
      .innerJoin('servers', 'accounts.server', 'servers.domain')
      .select([
        'workspaces.workspace_id',
        'workspaces.user_id',
        'accounts.token',
        'servers.domain',
        'servers.attributes',
      ])
      .execute();

    for (const workspace of workspaces) {
      if (this.workspaceBackoffs.has(workspace.user_id)) {
        const backoff = this.workspaceBackoffs.get(workspace.user_id);
        if (!backoff.canRetry()) {
          return;
        }
      }

      try {
        const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
          workspace.user_id,
        );

        const changes = await workspaceDatabase
          .selectFrom('changes')
          .selectAll()
          .orderBy('id asc')
          .limit(20)
          .execute();

        if (changes.length === 0) {
          return;
        }

        const axios = buildAxiosInstance(
          workspace.domain,
          workspace.attributes,
          workspace.token,
        );

        const { data } = await axios.post<ServerSyncResponse>(
          `/v1/sync/${workspace.workspace_id}`,
          {
            changes: changes,
          },
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
      } catch (error) {
        if (!this.workspaceBackoffs.has(workspace.user_id)) {
          this.workspaceBackoffs.set(
            workspace.user_id,
            new BackoffCalculator(),
          );
        }

        const backoff = this.workspaceBackoffs.get(workspace.user_id);
        backoff.increaseError();
      }
    }
  }
}

export const synchronizer = new Synchronizer();
