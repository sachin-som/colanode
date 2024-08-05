import { app } from 'electron';
import SQLite from 'better-sqlite3';
import { Kysely, Migration, Migrator, SqliteDialect } from 'kysely';
import { WorkspaceDatabaseSchema } from '@/electron/database/workspace/schema';
import { workspaceDatabaseMigrations } from '@/electron/database/workspace/migrations';
import * as fs from 'node:fs';
import { GlobalDatabase } from '@/electron/database/global';
import { Node } from '@/types/nodes';
import { NeuronId } from '@/lib/id';

export class WorkspaceDatabase {
  accountId: string;
  workspaceId: string;
  database: Kysely<WorkspaceDatabaseSchema>;
  globalDatabase: GlobalDatabase;

  constructor(
    accountId: string,
    workspaceId: string,
    globalDatabase: GlobalDatabase,
  ) {
    this.accountId = accountId;
    this.workspaceId = workspaceId;
    this.globalDatabase = globalDatabase;

    const appPath = app.getPath('userData');
    const accountPath = `${appPath}/account_${accountId}`;
    if (!fs.existsSync(accountPath)) {
      fs.mkdirSync(accountPath);
    }

    const dialect = new SqliteDialect({
      database: new SQLite(`${accountPath}/workspace_${workspaceId}.db`),
    });

    this.database = new Kysely<WorkspaceDatabaseSchema>({
      dialect,
    });
  }

  getNodes = async (): Promise<Node[]> => {
    const nodes = await this.database.selectFrom('nodes').selectAll().execute();

    return nodes.map((node) => ({
      id: node.id,
      type: node.type,
      index: node.index,
      parentId: node.parent_id,
      workspaceId: node.workspace_id,
      attrs: JSON.parse(node.attrs),
      content: JSON.parse(node.content),
      createdAt: new Date(node.created_at),
      createdBy: node.created_by,
      updatedAt: node.updated_at ? new Date(node.updated_at) : null,
      updatedBy: node.updated_by,
      versionId: node.version_id,
    }));
  };

  addNode = async (node: Node) => {
    await this.database
      .insertInto('nodes')
      .values({
        id: node.id,
        type: node.type,
        index: node.index,
        parent_id: node.parentId,
        workspace_id: this.workspaceId,
        created_at: new Date(node.createdAt).toISOString(),
        created_by: node.createdBy,
        version_id: node.versionId,
        attrs: JSON.stringify(node.attrs),
        content: JSON.stringify(node.content),
        updated_at: node.updatedAt
          ? new Date(node.updatedAt).toISOString()
          : null,
        updated_by: node.updatedBy,
      })
      .execute();

    await this.globalDatabase.addTransaction({
      id: NeuronId.generate(NeuronId.Type.Transaction),
      nodeId: node.id,
      type: 'create_node',
      workspaceId: node.workspaceId,
      accountId: this.accountId,
      input: JSON.stringify(node),
      createdAt: new Date(),
    });
  };

  addNodes = async (nodes: Node[]) => {
    await this.database
      .insertInto('nodes')
      .values(
        nodes.map((node) => ({
          id: node.id,
          type: node.type,
          index: node.index,
          parent_id: node.parentId,
          workspace_id: this.workspaceId,
          created_at: node.createdAt.toISOString(),
          created_by: node.createdBy,
          version_id: node.versionId,
          attrs: JSON.stringify(node.attrs),
          content: JSON.stringify(node.content),
        })),
      )
      .execute();

    // TODO: insert as single transaction
    for (const node of nodes) {
      await this.globalDatabase.addTransaction({
        id: NeuronId.generate(NeuronId.Type.Transaction),
        nodeId: node.id,
        type: 'create_node',
        workspaceId: node.workspaceId,
        accountId: this.accountId,
        input: JSON.stringify(node),
        createdAt: new Date(),
      });
    }
  };

  updateNode = async (node: Node) => {
    await this.database
      .updateTable('nodes')
      .set({
        type: node.type,
        index: node.index,
        parent_id: node.parentId,
        updated_at: node.updatedAt.toISOString(),
        updated_by: node.updatedBy,
        version_id: node.versionId,
        attrs: JSON.stringify(node.attrs),
        content: JSON.stringify(node.content),
      })
      .where('id', '=', node.id)
      .executeTakeFirst();

    await this.globalDatabase.addTransaction({
      id: NeuronId.getType(NeuronId.Type.Transaction),
      nodeId: node.id,
      type: 'update_node',
      workspaceId: node.workspaceId,
      accountId: this.accountId,
      input: JSON.stringify(node),
      createdAt: new Date(),
    });
  };

  deleteNode = async (nodeId: string) => {
    await this.database.deleteFrom('nodes').where('id', '=', nodeId).execute();

    await this.globalDatabase.addTransaction({
      id: NeuronId.generate(NeuronId.Type.Transaction),
      nodeId: nodeId,
      type: 'delete_node',
      workspaceId: this.workspaceId,
      accountId: this.accountId,
      input: JSON.stringify({ nodeId }),
      createdAt: new Date(),
    });
  };

  syncNodes = async (nodes: Node[]) => {
    const nodeIds = nodes.map((node) => node.id);
    const existingNodes = await this.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', 'in', nodeIds)
      .execute();

    for (const node of nodes) {
      const existingNode = existingNodes.find((n) => n.id === node.id);
      if (!existingNode) {
        await this.database
          .insertInto('nodes')
          .values({
            id: node.id,
            type: node.type,
            index: node.index,
            parent_id: node.parentId,
            workspace_id: this.workspaceId,
            created_at: new Date(node.createdAt).toISOString(),
            created_by: node.createdBy,
            version_id: node.versionId,
            attrs: JSON.stringify(node.attrs),
            content: JSON.stringify(node.content),
            updated_at: node.updatedAt
              ? new Date(node.updatedAt).toISOString()
              : null,
            updated_by: node.updatedBy,
          })
          .execute();
      } else if (
        existingNode.version_id != node.versionId &&
        new Date(existingNode.updated_at) <= node.updatedAt
      ) {
        await this.database
          .updateTable('nodes')
          .set({
            type: node.type,
            index: node.index,
            parent_id: node.parentId,
            updated_at: node.updatedAt.toISOString(),
            updated_by: node.updatedBy,
            version_id: node.versionId,
            attrs: JSON.stringify(node.attrs),
            content: JSON.stringify(node.content),
          })
          .where('id', '=', node.id)
          .executeTakeFirst();
      }
    }
  };

  migrate = async () => {
    const migrator = new Migrator({
      db: this.database,
      provider: {
        getMigrations(): Promise<Record<string, Migration>> {
          return Promise.resolve(workspaceDatabaseMigrations);
        },
      },
    });

    await migrator.migrateToLatest();
  };
}
