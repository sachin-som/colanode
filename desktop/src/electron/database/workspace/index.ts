import { app } from 'electron';
import SQLite from 'better-sqlite3';
import { Kysely, Migration, Migrator, SqliteDialect } from 'kysely';
import {
  NodesTableSchema,
  WorkspaceDatabaseSchema,
} from '@/electron/database/workspace/schema';
import { workspaceDatabaseMigrations } from '@/electron/database/workspace/migrations';
import * as fs from 'node:fs';
import { GlobalDatabase } from '@/electron/database/global';
import { CreateNodeInput, Node, UpdateNodeInput } from '@/types/nodes';
import { NeuronId } from '@/lib/id';
import { LeafNodeTypes, NodeTypes, RootNodeTypes } from '@/lib/constants';
import { eventBus } from '@/lib/event-bus';

export class WorkspaceDatabase {
  accountId: string;
  workspaceId: string;
  userId: string;
  database: Kysely<WorkspaceDatabaseSchema>;
  globalDatabase: GlobalDatabase;

  constructor(
    accountId: string,
    workspaceId: string,
    userId: string,
    globalDatabase: GlobalDatabase,
  ) {
    this.accountId = accountId;
    this.workspaceId = workspaceId;
    this.globalDatabase = globalDatabase;
    this.userId = userId;

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

  createNode = async (input: CreateNodeInput) => {
    const insertedRow = await this.database
      .insertInto('nodes')
      .values({
        id: input.id,
        type: input.type,
        index: input.index,
        parent_id: input.parentId,
        workspace_id: this.workspaceId,
        created_at: new Date().toISOString(),
        created_by: this.userId,
        version_id: NeuronId.generate(NeuronId.Type.Version),
        attrs: input.attrs && JSON.stringify(input.attrs),
        content: input.content && JSON.stringify(input.content),
      })
      .returningAll()
      .executeTakeFirst();

    const node: Node = {
      id: insertedRow.id,
      type: insertedRow.type,
      index: insertedRow.index,
      parentId: insertedRow.parent_id,
      workspaceId: insertedRow.workspace_id,
      attrs: insertedRow.attrs && JSON.parse(insertedRow.attrs),
      content: insertedRow.content && JSON.parse(insertedRow.content),
      createdAt: new Date(insertedRow.created_at),
      createdBy: insertedRow.created_by,
      updatedAt: insertedRow.updated_at
        ? new Date(insertedRow.updated_at)
        : null,
      updatedBy: insertedRow.updated_by,
      versionId: insertedRow.version_id,
    };

    await this.globalDatabase.addTransaction({
      id: NeuronId.generate(NeuronId.Type.Transaction),
      type: 'create_node',
      workspaceId: this.workspaceId,
      userId: this.userId,
      accountId: this.accountId,
      input: JSON.stringify(node),
      createdAt: new Date(),
    });

    eventBus.publish({
      event: 'node_created',
      payload: node,
    });
  };

  createNodes = async (inputs: CreateNodeInput[]) => {
    const insertedRows = await this.database
      .insertInto('nodes')
      .values(
        inputs.map((input) => ({
          id: input.id,
          type: input.type,
          index: input.index,
          parent_id: input.parentId,
          workspace_id: this.workspaceId,
          created_at: new Date().toISOString(),
          created_by: this.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
          attrs: input.attrs && JSON.stringify(input.attrs),
          content: input.content && JSON.stringify(input.content),
        })),
      )
      .returningAll()
      .execute();

    const nodes = insertedRows.map((node) => ({
      id: node.id,
      type: node.type,
      index: node.index,
      parentId: node.parent_id,
      workspaceId: node.workspace_id,
      attrs: node.attrs && JSON.parse(node.attrs),
      content: node.content && JSON.parse(node.content),
      createdAt: new Date(node.created_at),
      createdBy: node.created_by,
      updatedAt: node.updated_at ? new Date(node.updated_at) : null,
      updatedBy: node.updated_by,
      versionId: node.version_id,
    }));

    await this.globalDatabase.addTransaction({
      id: NeuronId.generate(NeuronId.Type.Transaction),
      type: 'create_nodes',
      workspaceId: this.workspaceId,
      userId: this.userId,
      accountId: this.accountId,
      input: JSON.stringify(nodes),
      createdAt: new Date(),
    });

    nodes.forEach((node) => {
      eventBus.publish({
        event: 'node_created',
        payload: node,
      });
    });
  };

  updateNode = async (input: UpdateNodeInput) => {
    let updateDefinition = this.database.updateTable('nodes').set({
      updated_at: new Date().toISOString(),
      updated_by: this.userId,
      version_id: NeuronId.generate(NeuronId.Type.Version),
    });

    if (input.attrs !== undefined) {
      updateDefinition = updateDefinition.set(
        'attrs',
        JSON.stringify(input.attrs),
      );
    }

    if (input.content !== undefined) {
      updateDefinition = updateDefinition.set(
        'content',
        JSON.stringify(input.content),
      );
    }

    if (input.index !== undefined) {
      updateDefinition = updateDefinition.set('index', input.index);
    }

    if (input.parentId !== undefined) {
      updateDefinition = updateDefinition.set('parent_id', input.parentId);
    }

    const updatedRow = await updateDefinition
      .where('id', '=', input.id)
      .returningAll()
      .executeTakeFirst();

    const node: Node = this.mapToNode(updatedRow);

    await this.globalDatabase.addTransaction({
      id: NeuronId.generate(NeuronId.Type.Transaction),
      type: 'update_node',
      workspaceId: node.workspaceId,
      accountId: this.accountId,
      userId: this.userId,
      input: JSON.stringify(input),
      createdAt: new Date(),
    });

    eventBus.publish({
      event: 'node_updated',
      payload: node,
    });
  };

  deleteNode = async (nodeId: string) => {
    const deletedRow = await this.database
      .deleteFrom('nodes')
      .where('id', '=', nodeId)
      .returningAll()
      .executeTakeFirst();

    await this.globalDatabase.addTransaction({
      id: NeuronId.generate(NeuronId.Type.Transaction),
      type: 'delete_node',
      workspaceId: this.workspaceId,
      accountId: this.accountId,
      userId: this.userId,
      input: nodeId,
      createdAt: new Date(),
    });

    const node: Node = this.mapToNode(deletedRow);
    eventBus.publish({
      event: 'node_deleted',
      payload: node,
    });
  };

  deleteNodes = async (nodeIds: string[]) => {
    const deletedRows = await this.database
      .deleteFrom('nodes')
      .where('id', 'in', nodeIds)
      .returningAll()
      .execute();

    await this.globalDatabase.addTransaction({
      id: NeuronId.generate(NeuronId.Type.Transaction),
      type: 'delete_nodes',
      workspaceId: this.workspaceId,
      accountId: this.accountId,
      userId: this.userId,
      input: JSON.stringify(nodeIds),
      createdAt: new Date(),
    });

    const nodes = deletedRows.map((node) => this.mapToNode(node));
    nodes.forEach((node) => {
      eventBus.publish({
        event: 'node_deleted',
        payload: node,
      });
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

  getSidebarNodes: () => Promise<Node[]> = async () => {
    const spaceRows = await this.database
      .selectFrom('nodes')
      .selectAll()
      .where('type', '=', NodeTypes.Space)
      .execute();

    const spaceIds = spaceRows.map((space) => space.id);
    const childRows = await this.database
      .selectFrom('nodes')
      .selectAll()
      .where('parent_id', 'in', spaceIds)
      .execute();

    const rows = [...spaceRows, ...childRows];
    return rows.map((row) => this.mapToNode(row));
  };

  getConversationNodes = async (
    conversationId: string,
    count: number,
    after?: string | null,
  ): Promise<Node[]> => {
    const messageQuery = this.database
      .selectFrom('nodes')
      .selectAll()
      .where('type', '=', 'message')
      .where('parent_id', '=', conversationId);

    if (after) {
      messageQuery.where('id', '<', after);
    }

    const messageRows = await messageQuery
      .orderBy('created_at', 'desc')
      .limit(count)
      .execute();

    const authorIds = messageRows.map((message) => message.created_by);
    const authorRows = await this.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', 'in', authorIds)
      .execute();

    const parentIds = messageRows.map((message) => message.id);
    const rows = [...messageRows, ...authorRows];

    while (parentIds.length > 0) {
      const childRows = await this.database
        .selectFrom('nodes')
        .selectAll()
        .where('parent_id', 'in', parentIds)
        .execute();

      rows.push(...childRows);
      parentIds.splice(0, parentIds.length);

      const newParentIds = childRows
        .filter(
          (row) =>
            !RootNodeTypes.includes(row.type) &&
            !LeafNodeTypes.includes(row.type),
        )
        .map((row) => row.id);

      parentIds.push(...newParentIds);
    }

    return rows.map((row) => this.mapToNode(row));
  };

  getDocumentNodes = async (documentId: string): Promise<Node[]> => {
    const rows = await this.database
      .selectFrom('nodes')
      .selectAll()
      .where('parent_id', '=', documentId)
      .execute();

    const parentIds = rows
      .filter(
        (row) =>
          !RootNodeTypes.includes(row.type) &&
          !LeafNodeTypes.includes(row.type),
      )
      .map((row) => row.id);

    while (parentIds.length > 0) {
      const childRows = await this.database
        .selectFrom('nodes')
        .selectAll()
        .where('parent_id', 'in', parentIds)
        .execute();

      rows.push(...childRows);
      parentIds.splice(0, parentIds.length);

      const childParentIds = childRows
        .filter(
          (row) =>
            !RootNodeTypes.includes(row.type) &&
            !LeafNodeTypes.includes(row.type),
        )
        .map((row) => row.id);

      parentIds.push(...childParentIds);
    }

    return rows.map((row) => this.mapToNode(row));
  };

  getContainerNodes = async (containerId: string): Promise<Node[]> => {
    const containerRow = await this.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', containerId)
      .executeTakeFirst();

    if (!containerRow) {
      return [];
    }

    const rows = [containerRow];
    let parentId = containerRow.parent_id;

    while (parentId) {
      const parentRow = await this.database
        .selectFrom('nodes')
        .selectAll()
        .where('id', '=', parentId)
        .executeTakeFirst();

      if (!parentRow) {
        break;
      }

      rows.push(parentRow);
      parentId = parentRow.parent_id;
    }

    return rows.map((row) => this.mapToNode(row));
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

  mapToNode = (node: NodesTableSchema): Node => {
    return {
      id: node.id,
      type: node.type,
      index: node.index,
      parentId: node.parent_id,
      workspaceId: node.workspace_id,
      attrs: node.attrs && JSON.parse(node.attrs),
      content: node.content && JSON.parse(node.content),
      createdAt: new Date(node.created_at),
      createdBy: node.created_by,
      updatedAt: node.updated_at ? new Date(node.updated_at) : null,
      updatedBy: node.updated_by,
      versionId: node.version_id,
    };
  };
}
