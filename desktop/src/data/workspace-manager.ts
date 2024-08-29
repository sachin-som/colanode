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
import { WorkspaceDatabaseSchema } from '@/data/schemas/workspace';
import { workspaceDatabaseMigrations } from '@/data/migrations/workspace';
import {
  buildSqlite,
  extractTablesFromSql,
  resultHasChanged,
} from '@/data/utils';
import { SubscribedQueryData } from '@/types/databases';
import { ServerMutation } from '@/types/mutations';
import { eventBus } from '@/lib/event-bus';
import { AxiosInstance } from 'axios';
import { debounce } from 'lodash';
import { ServerNode } from '@/types/nodes';
import { SelectNode } from '@/data/schemas/workspace';

export class WorkspaceManager {
  private readonly workspace: Workspace;
  private readonly axios: AxiosInstance;
  private readonly database: Kysely<WorkspaceDatabaseSchema>;
  private readonly subscribers: Map<string, SubscribedQueryData<unknown>>;
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
    queryId: string,
    query: CompiledQuery<T>,
  ): Promise<QueryResult<T>> {
    const result = await this.database.executeQuery(query);

    // only mutations should have side effects
    if (result.numAffectedRows > 0) {
      throw new Error('Query should not have any side effects');
    }

    const selectedTables = extractTablesFromSql(query.sql);
    const subscriberData: SubscribedQueryData<T> = {
      query,
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
      this.debouncedNotifyQuerySubscribers(Array.from(affectedTables));
    }
  }

  public unsubscribeQuery(queryId: string): void {
    this.subscribers.delete(queryId);
  }

  private async notifyQuerySubscribers(
    affectedTables: string[],
  ): Promise<void> {
    for (const [subscriberId, subscriberData] of this.subscribers) {
      const hasAffectedTables = subscriberData.tables.some((table) =>
        affectedTables.includes(table),
      );

      if (!hasAffectedTables) {
        continue;
      }

      const newResult = await this.database.executeQuery(subscriberData.query);

      if (resultHasChanged(subscriberData.result, newResult)) {
        subscriberData.result = newResult;
        eventBus.publish({
          event: 'workspace_query_updated',
          payload: {
            queryId: subscriberId,
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
      const { status } = await this.axios.post<ServerMutation>('v1/mutations', {
        workspaceId: this.workspace.id,
        mutations: mutations,
      });

      if (status === 200) {
        const mutationIds = mutations.map((mutation) => mutation.id);
        await this.database
          .deleteFrom('mutations')
          .where('id', 'in', mutationIds)
          .execute();
      }
    } catch (error) {
      console.error(error);
    }
  }

  public async executeServerMutation(mutation: ServerMutation): Promise<void> {
    if (mutation.table === 'nodes') {
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

    //other cases in the future
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

    for (const node of data.nodes) {
      await this.syncNodeFromServer(node);
    }

    this.workspace.synced = true;
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
          type: node.type,
          parent_id: node.parentId,
          index: node.index,
          content: node.content ? JSON.stringify(node.content) : null,
          attrs: node.attrs ? JSON.stringify(node.attrs) : null,
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
          type: node.type,
          parent_id: node.parentId,
          index: node.index,
          content: node.content ? JSON.stringify(node.content) : null,
          attrs: node.attrs ? JSON.stringify(node.attrs) : null,
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

  public shouldUpdateNodeFromServer(
    localNode: SelectNode,
    serverNode: ServerNode,
  ): boolean {
    if (localNode.server_version_id === serverNode.versionId) {
      return false;
    }

    if (localNode.updated_at) {
      if (!serverNode.updatedAt) {
        return false;
      }

      const localUpdatedAt = new Date(localNode.updated_at);
      const serverUpdatedAt = new Date(serverNode.updatedAt);

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
