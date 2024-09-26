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
import { WorkspaceDatabaseSchema } from '@/electron/schemas/workspace';
import { workspaceDatabaseMigrations } from '@/electron/migrations/workspace';
import {
  buildSqlite,
  extractTablesFromSql,
  resultHasChanged,
} from '@/electron/utils';
import { SubscribedQueryContext, SubscribedQueryResult } from '@/types/queries';
import {
  ServerExecuteMutationsResponse,
  ServerMutation,
} from '@/types/mutations';
import { eventBus } from '@/lib/event-bus';
import { AxiosInstance } from 'axios';
import { debounce, isEqual } from 'lodash';
import { ServerNode, ServerNodeReaction } from '@/types/nodes';
import { SelectNode } from '@/electron/schemas/workspace';

export class WorkspaceManager {
  private readonly workspace: Workspace;
  private readonly axios: AxiosInstance;
  private readonly database: Kysely<WorkspaceDatabaseSchema>;
  private readonly subscribers: Map<string, SubscribedQueryResult<unknown>>;
  private readonly debouncedNotifyQuerySubscribers: (
    affectedTables: string[],
  ) => void;

  constructor(workspace: Workspace, axios: AxiosInstance, accountPath: string) {
    this.workspace = workspace;
    this.axios = axios;
    this.subscribers = new Map();

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

  public async executeQueryAndSubscribe<T>(
    context: SubscribedQueryContext<T>,
  ): Promise<QueryResult<T>> {
    const result = await this.database.executeQuery(context.query);

    // only mutations should have side effects
    if (result.numAffectedRows > 0) {
      throw new Error('Query should not have any side effects');
    }

    const queryId = context.key.join('|') + context.page;
    const selectedTables = extractTablesFromSql(context.query.sql);
    const subscriberData: SubscribedQueryResult<T> = {
      context,
      tables: selectedTables,
      result: result,
    };
    this.subscribers.set(queryId, subscriberData);

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

  public unsubscribeQuery(queryKey: string[]): void {
    var queryIds = [...this.subscribers.keys()];
    for (const queryId of queryIds) {
      const subscriberData = this.subscribers.get(queryId);
      if (isEqual(subscriberData.context.key, queryKey)) {
        this.subscribers.delete(queryId);
      }
    }
  }

  private async notifyQuerySubscribers(
    affectedTables: string[],
  ): Promise<void> {
    for (const subscriber of this.subscribers.values()) {
      const hasAffectedTables = affectedTables.some((table) =>
        subscriber.tables.includes(table),
      );

      if (!hasAffectedTables) {
        continue;
      }

      const newResult = await this.database.executeQuery(
        subscriber.context.query,
      );

      if (resultHasChanged(subscriber.result, newResult)) {
        subscriber.result = newResult;
        eventBus.publish({
          event: 'workspace_query_updated',
          payload: {
            key: subscriber.context.key,
            page: subscriber.context.page,
            result: newResult,
          },
        });
      }
    }
  }

  public async sendMutations(): Promise<void> {
    const mutations = await this.database
      .selectFrom('mutations')
      .selectAll()
      .orderBy('id asc')
      .limit(20)
      .execute();

    if (!mutations || mutations.length === 0) {
      return;
    }

    try {
      const { status, data } =
        await this.axios.post<ServerExecuteMutationsResponse>('v1/mutations', {
          workspaceId: this.workspace.id,
          mutations: mutations,
        });

      if (status !== 200) {
        return;
      }

      const executedMutations = data.executedMutations;
      await this.database
        .deleteFrom('mutations')
        .where('id', 'in', executedMutations)
        .execute();

      const failedMutationIds = mutations
        .filter((mutation) => !executedMutations.includes(mutation.id))
        .map((mutation) => mutation.id);

      if (failedMutationIds.length > 0) {
        await this.database
          .updateTable('mutations')
          .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
          .where('id', 'in', failedMutationIds)
          .execute();
      }
    } catch (error) {
      console.error(error);
    }
  }

  public async executeServerMutation(mutation: ServerMutation): Promise<void> {
    if (mutation.table === 'nodes') {
      await this.executeNodeServerMutation(mutation);
    } else if (mutation.table === 'node_reactions') {
      await this.executeNodeReactionServerMutation(mutation);
    }

    //other cases in the future
  }

  private async executeNodeServerMutation(
    mutation: ServerMutation,
  ): Promise<void> {
    if (mutation.action === 'insert' && mutation.after) {
      await this.syncNodeFromServer(mutation.after);
    } else if (mutation.action === 'update' && mutation.after) {
      await this.syncNodeFromServer(mutation.after);
    } else if (mutation.action === 'delete' && mutation.before) {
      await this.database
        .deleteFrom('nodes')
        .where('id', '=', mutation.before.id)
        .execute();

      this.debouncedNotifyQuerySubscribers(['nodes']);
    }
  }

  private async executeNodeReactionServerMutation(
    mutation: ServerMutation,
  ): Promise<void> {
    if (mutation.action === 'insert' && mutation.after) {
      await this.syncNodeReactionFromServer(mutation.after);
    } else if (mutation.action === 'delete' && mutation.before) {
      await this.database
        .deleteFrom('node_reactions')
        .where((eb) =>
          eb.and([
            eb('node_id', '=', mutation.before.node_id),
            eb('reactor_id', '=', mutation.before.reactor_id),
            eb('reaction', '=', mutation.before.reaction),
          ]),
        )
        .execute();

      this.debouncedNotifyQuerySubscribers(['node_reactions']);
    }
  }

  public isSynced(): boolean {
    return this.workspace.synced;
  }

  public async sync(): Promise<boolean> {
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
                reactor_id: nodeReaction.reactorId,
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
    this.debouncedNotifyQuerySubscribers(['nodes', 'node_reactions']);
    return true;
  }

  public async syncNodeFromServer(node: ServerNode): Promise<void> {
    const existingNode = await this.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', node.id)
      .executeTakeFirst();

    if (!existingNode) {
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
        .execute();

      this.debouncedNotifyQuerySubscribers(['nodes']);
      return;
    }

    if (this.shouldUpdateNodeFromServer(existingNode, node)) {
      await this.database
        .updateTable('nodes')
        .set({
          attributes: node.attributes ? JSON.stringify(node.attributes) : null,
          state: node.state,
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
    }
  }

  private async syncNodeReactionFromServer(
    nodeReaction: ServerNodeReaction,
  ): Promise<void> {
    await this.database
      .insertInto('node_reactions')
      .values({
        node_id: nodeReaction.nodeId,
        reactor_id: nodeReaction.reactorId,
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
