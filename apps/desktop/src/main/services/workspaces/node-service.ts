import {
  generateId,
  IdType,
  createDebugger,
  NodeAttributes,
  DeleteNodeMutationData,
  SyncNodeData,
  SyncNodeTombstoneData,
  getNodeModel,
  CreateNodeMutationData,
  UpdateNodeMutationData,
  CanCreateNodeContext,
  CanUpdateAttributesContext,
  CanDeleteNodeContext,
} from '@colanode/core';
import { decodeState, encodeState, YDoc } from '@colanode/crdt';

import { fetchNodeTree } from '@/main/lib/utils';
import { mapNode } from '@/main/lib/mappers';
import { eventBus } from '@/shared/lib/event-bus';
import { WorkspaceService } from '@/main/services/workspaces/workspace-service';
import { SelectNode } from '@/main/databases/workspace';

const UPDATE_RETRIES_LIMIT = 20;

export type CreateNodeInput = {
  id: string;
  attributes: NodeAttributes;
  parentId: string | null;
};

export type UpdateNodeResult =
  | 'success'
  | 'not_found'
  | 'unauthorized'
  | 'failed'
  | 'invalid_attributes';

export class NodeService {
  private readonly debug = createDebugger('desktop:service:node');
  private readonly workspace: WorkspaceService;

  constructor(workspaceService: WorkspaceService) {
    this.workspace = workspaceService;
  }

  public async createNode(input: CreateNodeInput): Promise<SelectNode> {
    this.debug(`Creating ${Array.isArray(input) ? 'nodes' : 'node'}`);

    const tree = input.parentId
      ? await fetchNodeTree(this.workspace.database, input.parentId)
      : [];

    const model = getNodeModel(input.attributes.type);
    const canCreateNodeContext: CanCreateNodeContext = {
      user: {
        id: this.workspace.userId,
        role: this.workspace.role,
        workspaceId: this.workspace.id,
        accountId: this.workspace.accountId,
      },
      tree: tree.map(mapNode),
      attributes: input.attributes,
    };

    if (!model.canCreate(canCreateNodeContext)) {
      throw new Error('Insufficient permissions');
    }

    const ydoc = new YDoc();
    const update = ydoc.update(model.attributesSchema, input.attributes);

    if (!update) {
      throw new Error('Invalid attributes');
    }

    const createdAt = new Date().toISOString();
    const rootId = tree[0]?.id ?? input.id;

    const { createdNode, createdMutation } = await this.workspace.database
      .transaction()
      .execute(async (trx) => {
        const createdNode = await trx
          .insertInto('nodes')
          .returningAll()
          .values({
            id: input.id,
            root_id: rootId,
            attributes: JSON.stringify(input.attributes),
            created_at: createdAt,
            created_by: this.workspace.userId,
            local_revision: BigInt(0),
            server_revision: BigInt(0),
          })
          .executeTakeFirst();

        if (!createdNode) {
          throw new Error('Failed to create entry');
        }

        const createdState = await trx
          .insertInto('node_states')
          .returningAll()
          .values({
            id: input.id,
            state: update,
            revision: BigInt(0),
          })
          .executeTakeFirst();

        if (!createdState) {
          throw new Error('Failed to create state');
        }

        const mutationData: CreateNodeMutationData = {
          id: input.id,
          data: encodeState(update),
          createdAt: createdAt,
        };

        const createdMutation = await trx
          .insertInto('mutations')
          .returningAll()
          .values({
            id: generateId(IdType.Mutation),
            type: 'create_node',
            data: JSON.stringify(mutationData),
            created_at: createdAt,
            retries: 0,
          })
          .executeTakeFirst();

        if (!createdMutation) {
          throw new Error('Failed to create mutation');
        }

        return {
          createdNode,
          createdMutation,
        };
      });

    if (!createdNode) {
      throw new Error('Failed to create entry');
    }

    this.debug(`Created node ${createdNode.id} with type ${createdNode.type}`);

    eventBus.publish({
      type: 'node_created',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      node: mapNode(createdNode),
    });

    if (!createdMutation) {
      throw new Error('Failed to create mutation');
    }

    this.workspace.mutations.triggerSync();
    return createdNode;
  }

  public async updateNode<T extends NodeAttributes>(
    nodeId: string,
    updater: (attributes: T) => T
  ): Promise<UpdateNodeResult> {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      const result = await this.tryUpdateNode(nodeId, updater);
      if (result) {
        return result;
      }
    }

    return 'failed';
  }

  private async tryUpdateNode<T extends NodeAttributes>(
    nodeId: string,
    updater: (attributes: T) => T
  ): Promise<UpdateNodeResult | null> {
    this.debug(`Updating node ${nodeId}`);

    const tree = await fetchNodeTree(this.workspace.database, nodeId);
    const nodeRow = tree[tree.length - 1];
    if (!nodeRow || nodeRow.id !== nodeId) {
      return 'not_found';
    }

    const node = mapNode(nodeRow);
    const updateId = generateId(IdType.Update);
    const updatedAt = new Date().toISOString();
    const updatedAttributes = updater(node.attributes as T);

    const model = getNodeModel(updatedAttributes.type);

    const canUpdateAttributesContext: CanUpdateAttributesContext = {
      user: {
        id: this.workspace.userId,
        role: this.workspace.role,
        workspaceId: this.workspace.id,
        accountId: this.workspace.accountId,
      },
      tree: tree.map(mapNode),
      node: node,
      attributes: updatedAttributes,
    };

    if (!model.canUpdateAttributes(canUpdateAttributesContext)) {
      return 'unauthorized';
    }

    const state = await this.workspace.database
      .selectFrom('node_states')
      .where('id', '=', nodeId)
      .selectAll()
      .executeTakeFirst();

    const updates = await this.workspace.database
      .selectFrom('node_updates')
      .where('node_id', '=', nodeId)
      .selectAll()
      .execute();

    const ydoc = new YDoc();

    if (state) {
      ydoc.applyUpdate(state.state);
    }

    for (const update of updates) {
      ydoc.applyUpdate(update.data);
    }

    const update = ydoc.update(model.attributesSchema, updatedAttributes);

    if (!update) {
      return 'success';
    }

    const attributes = ydoc.getObject<NodeAttributes>();
    const localRevision = BigInt(node.localRevision) + BigInt(1);

    const { updatedNode, createdMutation } = await this.workspace.database
      .transaction()
      .execute(async (trx) => {
        const updatedNode = await trx
          .updateTable('nodes')
          .returningAll()
          .set({
            attributes: JSON.stringify(attributes),
            updated_at: updatedAt,
            updated_by: this.workspace.userId,
            local_revision: localRevision,
          })
          .where('id', '=', nodeId)
          .where('local_revision', '=', node.localRevision)
          .executeTakeFirst();

        if (!updatedNode) {
          throw new Error('Failed to update node');
        }

        const createdUpdate = await trx
          .insertInto('node_updates')
          .returningAll()
          .values({
            id: updateId,
            node_id: nodeId,
            data: update,
            created_at: updatedAt,
          })
          .executeTakeFirst();

        if (!createdUpdate) {
          throw new Error('Failed to create update');
        }

        const mutationData: UpdateNodeMutationData = {
          id: nodeId,
          updateId: updateId,
          data: encodeState(update),
          createdAt: updatedAt,
        };

        const createdMutation = await trx
          .insertInto('mutations')
          .returningAll()
          .values({
            id: generateId(IdType.Mutation),
            type: 'update_node',
            data: JSON.stringify(mutationData),
            created_at: updatedAt,
            retries: 0,
          })
          .executeTakeFirst();

        if (!createdMutation) {
          throw new Error('Failed to create mutation');
        }

        return {
          updatedNode,
          createdMutation,
        };
      });

    if (updatedNode) {
      this.debug(
        `Updated node ${updatedNode.id} with type ${updatedNode.type}`
      );

      eventBus.publish({
        type: 'node_updated',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        node: mapNode(updatedNode),
      });
    } else {
      this.debug(`Failed to update node ${nodeId}`);
    }

    if (createdMutation) {
      this.workspace.mutations.triggerSync();
    }

    if (updatedNode) {
      return 'success';
    }

    return null;
  }

  public async deleteNode(nodeId: string) {
    const tree = await fetchNodeTree(this.workspace.database, nodeId);
    const nodeRow = tree[tree.length - 1];
    if (!nodeRow || nodeRow.id !== nodeId) {
      return 'not_found';
    }

    const node = mapNode(nodeRow);

    const model = getNodeModel(node.attributes.type);

    const canDeleteNodeContext: CanDeleteNodeContext = {
      user: {
        id: this.workspace.userId,
        role: this.workspace.role,
        workspaceId: this.workspace.id,
        accountId: this.workspace.accountId,
      },
      tree: tree.map(mapNode),
      node: node,
    };

    if (!model.canDelete(canDeleteNodeContext)) {
      throw new Error('Insufficient permissions');
    }

    const { deletedNode, createdMutation } = await this.workspace.database
      .transaction()
      .execute(async (trx) => {
        const deletedNode = await trx
          .deleteFrom('nodes')
          .returningAll()
          .where('id', '=', nodeId)
          .executeTakeFirst();

        if (!deletedNode) {
          throw new Error('Failed to delete node');
        }

        await trx
          .insertInto('tombstones')
          .values({
            id: deletedNode.id,
            data: JSON.stringify(deletedNode),
            deleted_at: new Date().toISOString(),
          })
          .execute();

        const deleteMutationData: DeleteNodeMutationData = {
          id: nodeId,
          rootId: node.rootId,
          deletedAt: new Date().toISOString(),
        };

        const createdMutation = await trx
          .insertInto('mutations')
          .returningAll()
          .values({
            id: generateId(IdType.Mutation),
            type: 'delete_node',
            data: JSON.stringify(deleteMutationData),
            created_at: new Date().toISOString(),
            retries: 0,
          })
          .executeTakeFirst();

        return { deletedNode, createdMutation };
      });

    if (deletedNode) {
      this.debug(
        `Deleted node ${deletedNode.id} with type ${deletedNode.type}`
      );

      eventBus.publish({
        type: 'node_deleted',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        node: mapNode(deletedNode),
      });
    } else {
      this.debug(`Failed to delete node ${nodeId}`);
    }

    if (createdMutation) {
      this.workspace.mutations.triggerSync();
    }
  }

  public async syncServerNode(node: SyncNodeData) {
    const existingNode = await this.workspace.database
      .selectFrom('nodes')
      .where('id', '=', node.id)
      .selectAll()
      .executeTakeFirst();

    if (!existingNode) {
      return this.createServerNode(node);
    } else {
      return this.updateServerNode(node);
    }
  }

  private async createServerNode(node: SyncNodeData): Promise<void> {
    const serverRevision = BigInt(node.revision);

    const ydoc = new YDoc(node.state);
    const attributes = ydoc.getObject<NodeAttributes>();

    const { createdNode } = await this.workspace.database
      .transaction()
      .execute(async (trx) => {
        const createdNode = await trx
          .insertInto('nodes')
          .returningAll()
          .values({
            id: node.id,
            root_id: node.rootId,
            attributes: JSON.stringify(attributes),
            created_at: node.createdAt,
            created_by: node.createdBy,
            local_revision: 0n,
            server_revision: serverRevision,
          })
          .executeTakeFirst();

        if (!createdNode) {
          throw new Error('Failed to create node');
        }

        await trx
          .insertInto('node_states')
          .returningAll()
          .values({
            id: node.id,
            revision: serverRevision,
            state: decodeState(node.state),
          })
          .executeTakeFirst();

        return { createdNode };
      });

    if (!createdNode) {
      this.debug(`Failed to create node ${node.id}`);
      return;
    }

    this.debug(`Created node ${createdNode.id} with type ${createdNode.type}`);

    eventBus.publish({
      type: 'node_created',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      node: mapNode(createdNode),
    });
  }

  public async updateServerNode(node: SyncNodeData): Promise<void> {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      try {
        const result = await this.tryUpdateServerNode(node);

        if (result) {
          return;
        }
      } catch (error) {
        this.debug(`Failed to update node ${node.id}: ${error}`);
      }
    }
  }

  private async tryUpdateServerNode(node: SyncNodeData): Promise<boolean> {
    const serverRevision = BigInt(node.revision);

    const existingNode = await this.workspace.database
      .selectFrom('nodes')
      .where('id', '=', node.id)
      .selectAll()
      .executeTakeFirst();

    if (!existingNode) {
      await this.createServerNode(node);
      return true;
    }

    const ydoc = new YDoc(node.state);
    const updates = await this.workspace.database
      .selectFrom('node_updates')
      .selectAll()
      .where('node_id', '=', node.id)
      .orderBy('id', 'asc')
      .execute();

    for (const update of updates) {
      ydoc.applyUpdate(update.data);
    }

    const attributes = ydoc.getObject<NodeAttributes>();
    const localRevision = BigInt(existingNode.local_revision) + BigInt(1);

    const { updatedNode } = await this.workspace.database
      .transaction()
      .execute(async (trx) => {
        const updatedNode = await trx
          .updateTable('nodes')
          .returningAll()
          .set({
            attributes: JSON.stringify(attributes),
            updated_at: node.updatedAt,
            updated_by: node.updatedBy,
            local_revision: localRevision,
            server_revision: serverRevision,
          })
          .where('id', '=', node.id)
          .where('local_revision', '=', existingNode.local_revision)
          .executeTakeFirst();

        if (!updatedNode) {
          throw new Error('Failed to update node');
        }

        await trx
          .updateTable('node_states')
          .set({
            revision: serverRevision,
            state: decodeState(node.state),
          })
          .where('id', '=', node.id)
          .executeTakeFirst();

        return { updatedNode };
      });

    if (!updatedNode) {
      this.debug(`Failed to update node ${node.id}`);
      return false;
    }

    this.debug(`Updated node ${updatedNode.id} with type ${updatedNode.type}`);

    eventBus.publish({
      type: 'node_updated',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      node: mapNode(updatedNode),
    });

    return true;
  }

  public async syncServerNodeDelete(tombstone: SyncNodeTombstoneData) {
    this.debug(
      `Applying server delete transaction ${tombstone.id} for node ${tombstone.id}`
    );

    const { deletedNode } = await this.workspace.database
      .transaction()
      .execute(async (trx) => {
        const deletedNode = await trx
          .deleteFrom('nodes')
          .returningAll()
          .where('id', '=', tombstone.id)
          .executeTakeFirst();

        await trx
          .deleteFrom('node_updates')
          .where('node_id', '=', tombstone.id)
          .execute();

        await trx
          .deleteFrom('node_states')
          .where('id', '=', tombstone.id)
          .execute();

        await trx
          .deleteFrom('node_reactions')
          .where('node_id', '=', tombstone.id)
          .execute();

        await trx
          .deleteFrom('node_interactions')
          .where('node_id', '=', tombstone.id)
          .execute();

        await trx
          .deleteFrom('tombstones')
          .where('id', '=', tombstone.id)
          .execute();

        await trx
          .deleteFrom('documents')
          .where('id', '=', tombstone.id)
          .executeTakeFirst();

        await trx
          .deleteFrom('document_updates')
          .where('document_id', '=', tombstone.id)
          .execute();

        return { deletedNode };
      });

    if (deletedNode) {
      eventBus.publish({
        type: 'node_deleted',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        node: mapNode(deletedNode),
      });
    }
  }

  public async revertNodeCreate(mutation: CreateNodeMutationData) {
    const node = await this.workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', mutation.id)
      .executeTakeFirst();

    if (!node) {
      return;
    }

    await this.workspace.database.transaction().execute(async (tx) => {
      await tx.deleteFrom('nodes').where('id', '=', mutation.id).execute();

      await tx
        .deleteFrom('node_updates')
        .where('node_id', '=', mutation.id)
        .execute();

      await tx
        .deleteFrom('node_interactions')
        .where('node_id', '=', mutation.id)
        .execute();

      await tx
        .deleteFrom('node_reactions')
        .where('node_id', '=', mutation.id)
        .execute();

      await tx
        .deleteFrom('node_states')
        .where('id', '=', mutation.id)
        .execute();

      await tx.deleteFrom('documents').where('id', '=', mutation.id).execute();

      await tx
        .deleteFrom('document_updates')
        .where('document_id', '=', mutation.id)
        .execute();
    });

    if (node.type === 'file') {
      await this.workspace.files.deleteFile(node);
    }

    eventBus.publish({
      type: 'node_deleted',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      node: mapNode(node),
    });
  }

  public async revertNodeUpdate(mutation: UpdateNodeMutationData) {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      const result = await this.tryRevertNodeUpdate(mutation);

      if (result) {
        return;
      }
    }
  }

  private async tryRevertNodeUpdate(
    mutation: UpdateNodeMutationData
  ): Promise<boolean> {
    const node = await this.workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', mutation.id)
      .executeTakeFirst();

    if (!node) {
      // Make sure we don't have any data left behind
      await this.workspace.database
        .deleteFrom('node_updates')
        .where('id', '=', mutation.id)
        .execute();

      await this.workspace.database
        .deleteFrom('node_interactions')
        .where('node_id', '=', mutation.id)
        .execute();

      await this.workspace.database
        .deleteFrom('node_reactions')
        .where('node_id', '=', mutation.id)
        .execute();

      await this.workspace.database
        .deleteFrom('node_states')
        .where('id', '=', mutation.id)
        .execute();

      await this.workspace.database
        .deleteFrom('documents')
        .where('id', '=', mutation.id)
        .execute();

      await this.workspace.database
        .deleteFrom('document_updates')
        .where('document_id', '=', mutation.id)
        .execute();

      return true;
    }

    const updateRow = await this.workspace.database
      .selectFrom('node_updates')
      .selectAll()
      .where('id', '=', mutation.id)
      .executeTakeFirst();

    if (!updateRow) {
      return true;
    }

    const nodeUpdates = await this.workspace.database
      .selectFrom('node_updates')
      .selectAll()
      .where('node_id', '=', mutation.id)
      .orderBy('id', 'asc')
      .execute();

    const state = await this.workspace.database
      .selectFrom('node_states')
      .selectAll()
      .where('id', '=', mutation.id)
      .executeTakeFirst();

    if (!state) {
      return true;
    }

    const ydoc = new YDoc(state.state);
    for (const nodeUpdate of nodeUpdates) {
      if (nodeUpdate.id === mutation.updateId) {
        continue;
      }

      if (nodeUpdate.data) {
        ydoc.applyUpdate(nodeUpdate.data);
      }
    }

    const attributes = ydoc.getObject<NodeAttributes>();
    const updatedNode = await this.workspace.database
      .transaction()
      .execute(async (trx) => {
        const updatedNode = await trx
          .updateTable('nodes')
          .returningAll()
          .set({
            attributes: JSON.stringify(attributes),
          })
          .where('id', '=', mutation.id)
          .where('local_revision', '=', node.local_revision)
          .executeTakeFirst();

        if (!updatedNode) {
          return undefined;
        }

        await trx
          .deleteFrom('node_updates')
          .where('id', '=', mutation.updateId)
          .execute();
      });

    if (updatedNode) {
      eventBus.publish({
        type: 'node_updated',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        node: mapNode(updatedNode),
      });

      return true;
    }

    return false;
  }

  public async revertNodeDelete(mutation: DeleteNodeMutationData) {
    const tombstone = await this.workspace.database
      .selectFrom('tombstones')
      .selectAll()
      .where('id', '=', mutation.id)
      .executeTakeFirst();

    if (!tombstone) {
      return;
    }

    const state = await this.workspace.database
      .selectFrom('node_states')
      .selectAll()
      .where('id', '=', mutation.id)
      .executeTakeFirst();

    if (!state) {
      return;
    }

    const nodeUpdates = await this.workspace.database
      .selectFrom('node_updates')
      .selectAll()
      .where('node_id', '=', mutation.id)
      .orderBy('id', 'asc')
      .execute();

    const ydoc = new YDoc(state.state);
    for (const nodeUpdate of nodeUpdates) {
      ydoc.applyUpdate(nodeUpdate.data);
    }

    const attributes = ydoc.getObject<NodeAttributes>();
    const deletedNode = JSON.parse(tombstone.data) as SelectNode;

    const createdNode = await this.workspace.database
      .transaction()
      .execute(async (trx) => {
        const createdNode = await trx
          .insertInto('nodes')
          .returningAll()
          .values({
            id: deletedNode.id,
            root_id: deletedNode.root_id,
            created_at: deletedNode.created_at,
            created_by: deletedNode.created_by,
            attributes: JSON.stringify(attributes),
            updated_at: deletedNode.updated_at,
            updated_by: deletedNode.updated_by,
            local_revision: deletedNode.local_revision,
            server_revision: deletedNode.server_revision,
          })
          .onConflict((b) => b.doNothing())
          .executeTakeFirst();

        if (!createdNode) {
          return undefined;
        }

        await trx
          .deleteFrom('tombstones')
          .where('id', '=', mutation.id)
          .execute();
      });

    if (createdNode) {
      eventBus.publish({
        type: 'node_created',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        node: mapNode(createdNode),
      });

      return true;
    }

    return false;
  }
}
