import * as fs from 'node:fs';
import {
  CompiledQuery,
  Kysely,
  Migration,
  Migrator,
  QueryResult,
  SqliteDialect,
} from 'kysely';
import { Workspace, WorkspaceSyncData } from '@/types/workspaces';
import {
  SelectNodeCollaborator,
  WorkspaceDatabaseSchema,
} from '@/electron/schemas/workspace';
import { workspaceDatabaseMigrations } from '@/electron/migrations/workspace';
import {
  buildSqlite,
  extractTablesFromSql,
  resultHasChanged,
} from '@/electron/utils';
import {
  ServerExecuteMutationsResponse,
  ServerMutation,
} from '@/types/mutations';
import { eventBus } from '@/lib/event-bus';
import { AxiosInstance, isAxiosError } from 'axios';
import { debounce, isEqual } from 'lodash';
import {
  ServerNode,
  ServerNodeCollaborator,
  ServerNodeReaction,
} from '@/types/nodes';
import { SelectNode } from '@/electron/schemas/workspace';
import { BackoffCalculator } from '@/lib/backoff-calculator';
import * as Y from 'yjs';
import { fromUint8Array, toUint8Array } from 'js-base64';

export class WorkspaceManager {
  private readonly workspace: Workspace;
  private readonly axios: AxiosInstance;
  private readonly database: Kysely<WorkspaceDatabaseSchema>;
  private readonly backoffCalculator: BackoffCalculator;
  private readonly debouncedNotifyQuerySubscribers: (
    affectedTables: string[],
  ) => void;

  constructor(workspace: Workspace, axios: AxiosInstance, accountPath: string) {
    this.workspace = workspace;
    this.axios = axios;
    this.backoffCalculator = new BackoffCalculator();

    const workspaceDir = `${accountPath}/${workspace.id}`;
    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir);
    }

    const dialect = new SqliteDialect({
      database: buildSqlite(`${workspaceDir}/workspace.db`),
    });

    this.database = new Kysely<WorkspaceDatabaseSchema>({
      dialect,
    });

    this.debouncedNotifyQuerySubscribers = debounce(
      this.notifyQuerySubscribers,
      100,
    );
  }

  public getWorkspace(): Workspace {
    return this.workspace;
  }

  public async init(): Promise<void> {
    await this.migrate();
  }

  public async executeQuery<T>(
    query: CompiledQuery<T>,
  ): Promise<QueryResult<T>> {
    const result = await this.database.executeQuery(query);

    //only mutations should have side effects
    if (result.numAffectedRows > 0) {
      throw new Error('Query should not have any side effects');
    }

    return result;
  }

  public async executeMutation(
    mutation: CompiledQuery | CompiledQuery[],
  ): Promise<void> {
    const affectedTables = new Set<string>();
    let numAffectedRows = 0n;

    if (Array.isArray(mutation)) {
      // Execute multiple queries as a transaction
      await this.database.transaction().execute(async (trx) => {
        for (const query of mutation) {
          const result = await trx.executeQuery(query);
          if (result.numAffectedRows > 0n) {
            numAffectedRows += result.numAffectedRows;
            extractTablesFromSql(query.sql).forEach((table) =>
              affectedTables.add(table),
            );
          }
        }
      });
    } else {
      // Execute single query
      const result = await this.database.executeQuery(mutation);
      numAffectedRows = result.numAffectedRows;
      if (numAffectedRows > 0n) {
        extractTablesFromSql(mutation.sql).forEach((table) =>
          affectedTables.add(table),
        );
      }
    }

    if (numAffectedRows === 0n) {
      return;
    }

    if (affectedTables.size > 0) {
      this.notifyQuerySubscribers(Array.from(affectedTables));
    }
  }

  private async notifyQuerySubscribers(
    affectedTables: string[],
  ): Promise<void> {
    // for (const subscriber of this.subscribers.values()) {
    //   const hasAffectedTables = affectedTables.some((table) =>
    //     subscriber.tables.includes(table),
    //   );
    //   if (!hasAffectedTables) {
    //     continue;
    //   }
    //   const newResult = await this.database.executeQuery(
    //     subscriber.context.query,
    //   );
    //   if (resultHasChanged(subscriber.result, newResult)) {
    //     subscriber.result = newResult;
    //     eventBus.publish({
    //       event: 'workspace_query_updated',
    //       payload: {
    //         key: subscriber.context.key,
    //         page: subscriber.context.page,
    //         result: newResult,
    //       },
    //     });
    //   }
    // }
  }

  public async sendMutations(): Promise<void> {
    if (!this.backoffCalculator.canRetry()) {
      return;
    }

    try {
      const mutations = await this.database
        .selectFrom('mutations')
        .selectAll()
        .orderBy('id asc')
        .limit(20)
        .execute();

      if (!mutations || mutations.length === 0) {
        return;
      }

      const { status, data } =
        await this.axios.post<ServerExecuteMutationsResponse>('v1/mutations', {
          workspaceId: this.workspace.id,
          mutations: mutations,
        });

      if (status !== 200) {
        return;
      }

      const executedMutationIds = data.results
        .filter((result) => result.status === 'success')
        .map((result) => result.id);

      const mutliFailureMutationIds = mutations
        .filter(
          (mutation) =>
            mutation.retry_count >= 5 &&
            !executedMutationIds.includes(mutation.id),
        )
        .map((mutation) => mutation.id);

      const toDeleteMutationIds = [
        ...executedMutationIds,
        ...mutliFailureMutationIds,
      ];

      await this.database
        .deleteFrom('mutations')
        .where('id', 'in', toDeleteMutationIds)
        .execute();

      const failedMutationIds = data.results
        .filter((result) => result.status === 'error')
        .map((result) => result.id);

      if (failedMutationIds.length > 0) {
        await this.database
          .updateTable('mutations')
          .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
          .where('id', 'in', failedMutationIds)
          .execute();
      }

      this.backoffCalculator.reset();
    } catch (error) {
      if (isAxiosError(error)) {
        this.backoffCalculator.increaseError();
      }
    }
  }

  public async executeServerMutation(
    mutation: ServerMutation,
  ): Promise<boolean> {
    if (mutation.table === 'nodes') {
      return this.executeNodeServerMutation(mutation);
    } else if (mutation.table === 'node_collaborators') {
      return this.executeNodeCollaboratorServerMutation(mutation);
    } else if (mutation.table === 'node_reactions') {
      return this.executeNodeReactionServerMutation(mutation);
    }

    return false;
  }

  private async executeNodeServerMutation(
    mutation: ServerMutation,
  ): Promise<boolean> {
    if (mutation.action === 'insert' && mutation.after) {
      return this.createNodeFromServer(mutation.after);
    } else if (mutation.action === 'update' && mutation.after) {
      return this.updateNodeFromServer(mutation.after);
    } else if (mutation.action === 'delete' && mutation.before) {
      return this.deleteNodeFromServer(mutation.before);
    }
  }

  private async executeNodeCollaboratorServerMutation(
    mutation: ServerMutation,
  ): Promise<boolean> {
    if (mutation.action === 'insert' && mutation.after) {
      return this.syncNodeCollaboratorFromServer(mutation.after);
    } else if (mutation.action === 'update' && mutation.after) {
      return this.syncNodeCollaboratorFromServer(mutation.after);
    } else if (mutation.action === 'delete' && mutation.before) {
      await this.database
        .deleteFrom('node_collaborators')
        .where((eb) =>
          eb.and([
            eb('node_id', '=', mutation.before.node_id),
            eb('collaborator_id', '=', mutation.before.collaborator_id),
          ]),
        )
        .execute();

      this.debouncedNotifyQuerySubscribers(['node_collaborators']);
      return true;
    }
  }

  private async executeNodeReactionServerMutation(
    mutation: ServerMutation,
  ): Promise<boolean> {
    if (mutation.action === 'insert' && mutation.after) {
      return this.syncNodeReactionFromServer(mutation.after);
    } else if (mutation.action === 'delete' && mutation.before) {
      await this.database
        .deleteFrom('node_reactions')
        .where((eb) =>
          eb.and([
            eb('node_id', '=', mutation.before.node_id),
            eb('actor_id', '=', mutation.before.actor_id),
            eb('reaction', '=', mutation.before.reaction),
          ]),
        )
        .execute();

      this.debouncedNotifyQuerySubscribers(['node_reactions']);
      return true;
    }
  }

  public isSynced(): boolean {
    return this.workspace.synced;
  }

  public async sync(): Promise<boolean> {
    if (!this.backoffCalculator.canRetry()) {
      return false;
    }

    try {
      if (this.workspace.synced) {
        return true;
      }

      const { data, status } = await this.axios.get<WorkspaceSyncData>(
        `v1/${this.workspace.id}/sync`,
      );

      if (status !== 200) {
        return false;
      }

      if (data.nodes.length === 0 && data.nodeReactions.length === 0) {
        return true;
      }

      await this.database.transaction().execute(async (trx) => {
        if (data.nodes.length > 0) {
          await trx.deleteFrom('nodes').execute();

          await trx
            .insertInto('nodes')
            .values(
              data.nodes.map((node) => {
                return {
                  id: node.id,
                  attributes: JSON.stringify(node.attributes),
                  state: node.state,
                  created_at: node.createdAt,
                  created_by: node.createdBy,
                  updated_by: node.updatedBy,
                  updated_at: node.updatedAt,
                  version_id: node.versionId,
                  server_created_at: node.serverCreatedAt,
                  server_updated_at: node.serverUpdatedAt,
                  server_version_id: node.versionId,
                };
              }),
            )
            .execute();
        }

        if (data.nodeReactions.length > 0) {
          await trx.deleteFrom('node_reactions').execute();

          await trx
            .insertInto('node_reactions')
            .values(
              data.nodeReactions.map((nodeReaction) => {
                return {
                  node_id: nodeReaction.nodeId,
                  actor_id: nodeReaction.actorId,
                  reaction: nodeReaction.reaction,
                  created_at: nodeReaction.createdAt,
                  server_created_at: nodeReaction.serverCreatedAt,
                };
              }),
            )
            .execute();
        }
      });

      this.workspace.synced = true;
      this.backoffCalculator.reset();
      this.debouncedNotifyQuerySubscribers(['nodes', 'node_reactions']);
      return true;
    } catch (error) {
      if (isAxiosError(error)) {
        this.backoffCalculator.increaseError();
      }
    }

    return false;
  }

  private async createNodeFromServer(node: ServerNode): Promise<boolean> {
    await this.database
      .insertInto('nodes')
      .values({
        id: node.id,
        attributes: JSON.stringify(node.attributes),
        state: node.state,
        created_at: node.createdAt,
        created_by: node.createdBy,
        updated_by: node.updatedBy,
        updated_at: node.updatedAt,
        version_id: node.versionId,
        server_created_at: node.serverCreatedAt,
        server_updated_at: node.serverUpdatedAt,
        server_version_id: node.versionId,
      })
      .onConflict((cb) =>
        cb
          .doUpdateSet({
            server_created_at: node.serverCreatedAt,
            server_updated_at: node.serverUpdatedAt,
            server_version_id: node.versionId,
          })
          .where('version_id', '=', node.versionId),
      )
      .execute();

    this.debouncedNotifyQuerySubscribers(['nodes']);
    return true;
  }

  private async updateNodeFromServer(node: ServerNode): Promise<boolean> {
    const existingNode = await this.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', node.id)
      .executeTakeFirst();

    if (!this.shouldUpdateNodeFromServer(existingNode, node)) {
      return true;
    }
    const doc = new Y.Doc({
      guid: node.id,
    });

    Y.applyUpdate(doc, toUint8Array(existingNode.state));
    Y.applyUpdate(doc, toUint8Array(node.state));

    const attributesMap = doc.getMap('attributes');
    const attributes = JSON.stringify(attributesMap.toJSON());
    const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

    await this.database
      .updateTable('nodes')
      .set({
        attributes: attributes,
        state: encodedState,
        updated_at: node.updatedAt,
        updated_by: node.updatedBy,
        version_id: node.versionId,
        server_created_at: node.serverCreatedAt,
        server_updated_at: node.serverUpdatedAt,
        server_version_id: node.versionId,
      })
      .where('id', '=', node.id)
      .execute();

    this.debouncedNotifyQuerySubscribers(['nodes']);
    return true;
  }

  private async deleteNodeFromServer(node: ServerNode): Promise<boolean> {
    await this.database.deleteFrom('nodes').where('id', '=', node.id).execute();
    this.debouncedNotifyQuerySubscribers(['nodes']);
    return true;
  }

  public async syncNodeCollaboratorFromServer(
    nodeCollaborator: ServerNodeCollaborator,
  ): Promise<boolean> {
    const existingNodeCollaborator = await this.database
      .selectFrom('node_collaborators')
      .selectAll()
      .where((eb) =>
        eb.and([
          eb('node_id', '=', nodeCollaborator.nodeId),
          eb('collaborator_id', '=', nodeCollaborator.collaboratorId),
        ]),
      )
      .executeTakeFirst();

    if (!existingNodeCollaborator) {
      await this.database
        .insertInto('node_collaborators')
        .values({
          node_id: nodeCollaborator.nodeId,
          collaborator_id: nodeCollaborator.collaboratorId,
          role: nodeCollaborator.role,
          created_at: nodeCollaborator.createdAt,
          created_by: nodeCollaborator.createdBy,
          updated_by: nodeCollaborator.updatedBy,
          updated_at: nodeCollaborator.updatedAt,
          version_id: nodeCollaborator.versionId,
          server_created_at: nodeCollaborator.serverCreatedAt,
          server_updated_at: nodeCollaborator.serverUpdatedAt,
          server_version_id: nodeCollaborator.versionId,
        })
        .execute();

      this.debouncedNotifyQuerySubscribers(['node_collaborators']);
      return true;
    }

    if (
      this.shouldUpdateNodeCollaboratorFromServer(
        existingNodeCollaborator,
        nodeCollaborator,
      )
    ) {
      await this.database
        .updateTable('node_collaborators')
        .set({
          role: nodeCollaborator.role,
          updated_at: nodeCollaborator.updatedAt,
          updated_by: nodeCollaborator.updatedBy,
          version_id: nodeCollaborator.versionId,
          server_created_at: nodeCollaborator.serverCreatedAt,
          server_updated_at: nodeCollaborator.serverUpdatedAt,
          server_version_id: nodeCollaborator.versionId,
        })
        .where((eb) =>
          eb.and([
            eb('node_id', '=', nodeCollaborator.nodeId),
            eb('collaborator_id', '=', nodeCollaborator.collaboratorId),
          ]),
        )
        .execute();

      this.debouncedNotifyQuerySubscribers(['node_collaborators']);
      return true;
    }
  }

  private async syncNodeReactionFromServer(
    nodeReaction: ServerNodeReaction,
  ): Promise<boolean> {
    await this.database
      .insertInto('node_reactions')
      .values({
        node_id: nodeReaction.nodeId,
        actor_id: nodeReaction.actorId,
        reaction: nodeReaction.reaction,
        created_at: nodeReaction.createdAt,
        server_created_at: nodeReaction.serverCreatedAt,
      })
      .onConflict((ob) =>
        ob.doUpdateSet({
          server_created_at: nodeReaction.serverCreatedAt,
        }),
      )
      .execute();

    this.debouncedNotifyQuerySubscribers(['node_reactions']);
    return true;
  }

  public shouldUpdateNodeFromServer(
    localNode: SelectNode,
    serverNode: ServerNode,
  ): boolean {
    if (localNode.server_version_id === serverNode.versionId) {
      return false;
    }

    return true;
  }

  public shouldUpdateNodeCollaboratorFromServer(
    localNodeCollaborator: SelectNodeCollaborator,
    serverNodeCollaborator: ServerNodeCollaborator,
  ): boolean {
    if (
      localNodeCollaborator.server_version_id ===
      serverNodeCollaborator.versionId
    ) {
      return false;
    }

    if (localNodeCollaborator.updated_at) {
      if (!serverNodeCollaborator.updatedAt) {
        return false;
      }
      const localUpdatedAt = new Date(localNodeCollaborator.updated_at);
      const serverUpdatedAt = new Date(serverNodeCollaborator.updatedAt);
      if (localUpdatedAt > serverUpdatedAt) {
        return false;
      }
    }

    return true;
  }

  private async migrate(): Promise<void> {
    const migrator = new Migrator({
      db: this.database,
      provider: {
        getMigrations(): Promise<Record<string, Migration>> {
          return Promise.resolve(workspaceDatabaseMigrations);
        },
      },
    });

    await migrator.migrateToLatest();
  }
}
