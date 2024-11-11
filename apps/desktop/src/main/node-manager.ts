import {
  Node,
  NodeAttributes,
  NodeMutationContext,
  registry,
} from '@colanode/core';
import { YDoc } from '@colanode/crdt';
import {
  LocalCreateNodeChangeData,
  LocalDeleteNodeChangeData,
  LocalUpdateNodeChangeData,
} from '@/types/sync';
import { generateId, IdType } from '@colanode/core';
import { databaseManager } from '@/main/data/database-manager';
import { hasUpdateChanges, mapNode } from '@/main/utils';
import { Kysely, Transaction } from 'kysely';
import {
  CreateDownload,
  CreateUpload,
  SelectNode,
  WorkspaceDatabaseSchema,
} from '@/main/data/workspace/schema';

export type CreateNodeInput = {
  id: string;
  attributes: NodeAttributes;
  upload?: CreateUpload;
  download?: CreateDownload;
};

class NodeManager {
  async createNode(userId: string, input: CreateNodeInput | CreateNodeInput[]) {
    const workspace = await databaseManager.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const inputs = Array.isArray(input) ? input : [input];

    const workspaceDatabase =
      await databaseManager.getWorkspaceDatabase(userId);

    await workspaceDatabase.transaction().execute(async (transaction) => {
      for (const input of inputs) {
        const model = registry.getModel(input.attributes.type);
        if (!model.schema.safeParse(input.attributes).success) {
          throw new Error('Invalid attributes');
        }

        let ancestors: Node[] = [];
        if (input.attributes.parentId) {
          const ancestorRows = await this.fetchNodeAncestors(
            transaction,
            input.attributes.parentId
          );
          ancestors = ancestorRows.map(mapNode);
        }

        const context = new NodeMutationContext(
          workspace.account_id,
          workspace.workspace_id,
          userId,
          workspace.role,
          ancestors
        );

        if (!model.canCreate(context, input.attributes)) {
          throw new Error('Insufficient permissions');
        }

        const ydoc = new YDoc(input.id);
        ydoc.updateAttributes(input.attributes);

        const createdAt = new Date().toISOString();
        const versionId = generateId(IdType.Version);

        const changeData: LocalCreateNodeChangeData = {
          type: 'node_create',
          id: input.id,
          state: ydoc.getEncodedState(),
          createdAt: createdAt,
          createdBy: context.userId,
          versionId: versionId,
        };

        await transaction
          .insertInto('nodes')
          .values({
            id: input.id,
            attributes: JSON.stringify(input.attributes),
            state: ydoc.getState(),
            created_at: createdAt,
            created_by: context.userId,
            version_id: versionId,
          })
          .execute();

        await transaction
          .insertInto('changes')
          .values({
            data: JSON.stringify(changeData),
            created_at: createdAt,
            retry_count: 0,
          })
          .execute();

        if (input.upload) {
          await transaction
            .insertInto('uploads')
            .values(input.upload)
            .execute();
        }

        if (input.download) {
          await transaction
            .insertInto('downloads')
            .values(input.download)
            .execute();
        }
      }
    });
  }

  async updateNode(
    nodeId: string,
    userId: string,
    updater: (attributes: NodeAttributes) => NodeAttributes
  ) {
    let count = 0;
    while (count++ < 20) {
      const updated = await this.tryUpdateNode(nodeId, userId, updater);
      if (updated) {
        return;
      }
    }

    throw new Error('Failed to update node');
  }

  private async tryUpdateNode(
    nodeId: string,
    userId: string,
    updater: (attributes: NodeAttributes) => NodeAttributes
  ): Promise<boolean> {
    const workspace = await databaseManager.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const workspaceDatabase =
      await databaseManager.getWorkspaceDatabase(userId);

    const ancestorRows = await this.fetchNodeAncestors(
      workspaceDatabase,
      nodeId
    );
    const nodeRow = ancestorRows.find((ancestor) => ancestor.id === nodeId);
    if (!nodeRow) {
      throw new Error('Node not found');
    }

    const ancestors = ancestorRows.map(mapNode);
    const node = mapNode(nodeRow);

    if (!node) {
      throw new Error('Node not found');
    }

    const context = new NodeMutationContext(
      workspace.account_id,
      workspace.workspace_id,
      userId,
      workspace.role,
      ancestors
    );

    const versionId = generateId(IdType.Version);
    const updatedAt = new Date().toISOString();
    const updatedAttributes = updater(node.attributes);

    const model = registry.getModel(node.type);
    if (!model.schema.safeParse(updatedAttributes).success) {
      throw new Error('Invalid attributes');
    }

    if (!model.canUpdate(context, node, updatedAttributes)) {
      throw new Error('Insufficient permissions');
    }

    const ydoc = new YDoc(nodeRow.id, nodeRow.state);
    ydoc.updateAttributes(updatedAttributes);

    const updates = ydoc.getEncodedUpdates();
    if (updates.length === 0) {
      return true;
    }

    const changeData: LocalUpdateNodeChangeData = {
      type: 'node_update',
      id: nodeId,
      updatedAt: updatedAt,
      updatedBy: context.userId,
      versionId: versionId,
      updates: updates,
    };

    const result = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const result = await trx
          .updateTable('nodes')
          .set({
            attributes: JSON.stringify(ydoc.getAttributes()),
            state: ydoc.getState(),
            updated_at: updatedAt,
            updated_by: context.userId,
            version_id: versionId,
          })
          .where('id', '=', nodeId)
          .where('version_id', '=', node.versionId)
          .execute();

        const hasChanges = hasUpdateChanges(result);

        if (hasChanges) {
          await trx
            .insertInto('changes')
            .values({
              data: JSON.stringify(changeData),
              created_at: updatedAt,
              retry_count: 0,
            })
            .execute();
        }

        return hasChanges;
      });

    return result;
  }

  async deleteNode(nodeId: string, userId: string) {
    const workspace = await databaseManager.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const workspaceDatabase =
      await databaseManager.getWorkspaceDatabase(userId);

    const ancestorRows = await this.fetchNodeAncestors(
      workspaceDatabase,
      nodeId
    );
    const ancestors = ancestorRows.map(mapNode);
    const node = ancestors.find((ancestor) => ancestor.id === nodeId);

    if (!node) {
      throw new Error('Node not found');
    }

    const model = registry.getModel(node.type);
    const context = new NodeMutationContext(
      workspace.account_id,
      workspace.workspace_id,
      userId,
      workspace.role,
      ancestors
    );

    if (!model.canDelete(context, node)) {
      throw new Error('Insufficient permissions');
    }

    const changeData: LocalDeleteNodeChangeData = {
      type: 'node_delete',
      id: nodeId,
      deletedAt: new Date().toISOString(),
      deletedBy: context.userId,
    };

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx
        .deleteFrom('user_nodes')
        .where('node_id', '=', nodeId)
        .execute();
      await trx.deleteFrom('nodes').where('id', '=', nodeId).execute();
      await trx.deleteFrom('uploads').where('node_id', '=', nodeId).execute();
      await trx.deleteFrom('downloads').where('node_id', '=', nodeId).execute();

      await trx
        .insertInto('changes')
        .values({
          data: JSON.stringify(changeData),
          created_at: new Date().toISOString(),
          retry_count: 0,
        })
        .execute();
    });
  }

  private async fetchNodeAncestors(
    database:
      | Kysely<WorkspaceDatabaseSchema>
      | Transaction<WorkspaceDatabaseSchema>,
    nodeId: string
  ): Promise<SelectNode[]> {
    return database
      .selectFrom('nodes')
      .selectAll()
      .where(
        'id',
        'in',
        database
          .selectFrom('node_paths')
          .select('ancestor_id')
          .where('descendant_id', '=', nodeId)
      )
      .execute();
  }
}

export const nodeManager = new NodeManager();
