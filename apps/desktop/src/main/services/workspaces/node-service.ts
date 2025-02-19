import {
  generateId,
  IdType,
  createDebugger,
  NodeAttributes,
  DeleteNodeMutationData,
  SyncNodeUpdateData,
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
      tree: tree,
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

    const updateId = generateId(IdType.Update);
    const createdAt = new Date().toISOString();
    const rootId = tree[0]?.id ?? input.id;
    const nodeText = model.extractNodeText(input.id, input.attributes);

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

        const createdNodeUpdate = await trx
          .insertInto('node_updates')
          .returningAll()
          .values({
            id: updateId,
            node_id: input.id,
            data: update,
            created_at: createdAt,
          })
          .executeTakeFirst();

        if (!createdNodeUpdate) {
          throw new Error('Failed to create node update');
        }

        const mutationData: CreateNodeMutationData = {
          nodeId: input.id,
          updateId: updateId,
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

        if (nodeText) {
          await trx
            .insertInto('node_texts')
            .values({
              id: input.id,
              name: nodeText.name,
              attributes: nodeText.attributes,
            })
            .execute();
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
    const node = tree[tree.length - 1];
    if (!node || node.id !== nodeId) {
      return 'not_found';
    }

    const updateId = generateId(IdType.Update);
    const updatedAt = new Date().toISOString();
    const updatedAttributes = updater(node.attributes as T);

    const canUpdateAttributesContext: CanUpdateAttributesContext = {
      user: {
        id: this.workspace.userId,
        role: this.workspace.role,
        workspaceId: this.workspace.id,
        accountId: this.workspace.accountId,
      },
      tree: tree,
      node: node,
      attributes: updatedAttributes,
    };

    const model = getNodeModel(updatedAttributes.type);
    if (!model.canUpdateAttributes(canUpdateAttributesContext)) {
      return 'unauthorized';
    }

    const nodeState = await this.workspace.database
      .selectFrom('node_states')
      .where('id', '=', nodeId)
      .selectAll()
      .executeTakeFirst();

    const nodeUpdates = await this.workspace.database
      .selectFrom('node_updates')
      .where('node_id', '=', nodeId)
      .selectAll()
      .execute();

    const ydoc = new YDoc(nodeState?.state);
    for (const update of nodeUpdates) {
      ydoc.applyUpdate(update.data);
    }

    const update = ydoc.update(model.attributesSchema, updatedAttributes);

    if (!update) {
      return 'success';
    }

    const attributes = ydoc.getObject<NodeAttributes>();
    const localRevision = BigInt(node.localRevision) + BigInt(1);
    const nodeText = model.extractNodeText(nodeId, node.attributes);

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
          nodeId: nodeId,
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

        if (nodeText) {
          await trx
            .insertInto('node_texts')
            .values({
              id: nodeId,
              name: nodeText.name,
              attributes: nodeText.attributes,
            })
            .execute();
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
    const node = tree[tree.length - 1];
    if (!node || node.id !== nodeId) {
      return 'not_found';
    }

    const model = getNodeModel(node.attributes.type);
    const canDeleteNodeContext: CanDeleteNodeContext = {
      user: {
        id: this.workspace.userId,
        role: this.workspace.role,
        workspaceId: this.workspace.id,
        accountId: this.workspace.accountId,
      },
      tree: tree,
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
          nodeId: nodeId,
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

  public async syncServerNodeUpdate(update: SyncNodeUpdateData) {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      try {
        const existingNode = await this.workspace.database
          .selectFrom('nodes')
          .where('id', '=', update.nodeId)
          .selectAll()
          .executeTakeFirst();

        if (!existingNode) {
          const result = await this.tryCreateServerNode(update);
          if (result) {
            return;
          }
        } else {
          const result = await this.tryUpdateServerNode(existingNode, update);
          if (result) {
            return;
          }
        }
      } catch (error) {
        this.debug(`Failed to update node ${update.id}: ${error}`);
      }
    }
  }

  private async tryCreateServerNode(
    update: SyncNodeUpdateData
  ): Promise<boolean> {
    const serverRevision = BigInt(update.revision);

    const ydoc = new YDoc(update.data);
    const attributes = ydoc.getObject<NodeAttributes>();

    const model = getNodeModel(attributes.type);
    const nodeText = model.extractNodeText(update.id, attributes);

    const { createdNode } = await this.workspace.database
      .transaction()
      .execute(async (trx) => {
        const createdNode = await trx
          .insertInto('nodes')
          .returningAll()
          .values({
            id: update.nodeId,
            root_id: update.rootId,
            attributes: JSON.stringify(attributes),
            created_at: update.createdAt,
            created_by: update.createdBy,
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
            id: update.nodeId,
            revision: serverRevision,
            state: decodeState(update.data),
          })
          .executeTakeFirst();

        if (nodeText) {
          await trx
            .insertInto('node_texts')
            .values({
              id: update.nodeId,
              name: nodeText.name,
              attributes: nodeText.attributes,
            })
            .execute();
        }

        return { createdNode };
      });

    if (!createdNode) {
      this.debug(`Failed to create node ${update.nodeId}`);
      return false;
    }

    this.debug(`Created node ${createdNode.id} with type ${createdNode.type}`);

    eventBus.publish({
      type: 'node_created',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      node: mapNode(createdNode),
    });

    return true;
  }

  private async tryUpdateServerNode(
    existingNode: SelectNode,
    update: SyncNodeUpdateData
  ): Promise<boolean> {
    const nodeState = await this.workspace.database
      .selectFrom('node_states')
      .where('id', '=', existingNode.id)
      .selectAll()
      .executeTakeFirst();

    const nodeUpdates = await this.workspace.database
      .selectFrom('node_updates')
      .selectAll()
      .where('node_id', '=', existingNode.id)
      .orderBy('id', 'asc')
      .execute();

    const ydoc = new YDoc(nodeState?.state);
    ydoc.applyUpdate(update.data);

    const serverRevision = BigInt(update.revision);
    const serverState = ydoc.getState();

    for (const nodeUpdate of nodeUpdates) {
      if (nodeUpdate.id === update.id) {
        continue;
      }

      ydoc.applyUpdate(nodeUpdate.data);
    }

    const attributes = ydoc.getObject<NodeAttributes>();
    const localRevision = BigInt(existingNode.local_revision) + BigInt(1);

    const model = getNodeModel(attributes.type);
    const nodeText = model.extractNodeText(existingNode.id, attributes);

    const mergedUpdateIds = update.mergedUpdates?.map((u) => u.id) ?? [];
    const updatesToDelete = [update.id, ...mergedUpdateIds];

    const { updatedNode } = await this.workspace.database
      .transaction()
      .execute(async (trx) => {
        const updatedNode = await trx
          .updateTable('nodes')
          .returningAll()
          .set({
            attributes: JSON.stringify(attributes),
            updated_at: update.createdAt,
            updated_by: update.createdBy,
            local_revision: localRevision,
            server_revision: serverRevision,
          })
          .where('id', '=', existingNode.id)
          .where('local_revision', '=', existingNode.local_revision)
          .executeTakeFirst();

        if (!updatedNode) {
          throw new Error('Failed to update node');
        }

        const upsertedState = await trx
          .insertInto('node_states')
          .returningAll()
          .values({
            id: existingNode.id,
            revision: serverRevision,
            state: serverState,
          })
          .onConflict((cb) =>
            cb
              .doUpdateSet({
                revision: serverRevision,
                state: serverState,
              })
              .where('revision', '=', BigInt(nodeState?.revision ?? 0))
          )
          .executeTakeFirst();

        if (!upsertedState) {
          throw new Error('Failed to update node state');
        }

        if (nodeText) {
          await trx
            .insertInto('node_texts')
            .values({
              id: existingNode.id,
              name: nodeText.name,
              attributes: nodeText.attributes,
            })
            .execute();
        }

        if (updatesToDelete.length > 0) {
          await trx
            .deleteFrom('node_updates')
            .where('id', 'in', updatesToDelete)
            .execute();
        }

        return { updatedNode };
      });

    if (!updatedNode) {
      this.debug(`Failed to update node ${existingNode.id}`);
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

        await trx
          .deleteFrom('node_texts')
          .where('id', '=', tombstone.id)
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
      .where('id', '=', mutation.nodeId)
      .executeTakeFirst();

    if (!node) {
      return;
    }

    await this.workspace.database.transaction().execute(async (tx) => {
      await tx.deleteFrom('nodes').where('id', '=', mutation.nodeId).execute();

      await tx
        .deleteFrom('node_updates')
        .where('node_id', '=', mutation.nodeId)
        .execute();

      await tx
        .deleteFrom('node_interactions')
        .where('node_id', '=', mutation.nodeId)
        .execute();

      await tx
        .deleteFrom('node_reactions')
        .where('node_id', '=', mutation.nodeId)
        .execute();

      await tx
        .deleteFrom('node_states')
        .where('id', '=', mutation.nodeId)
        .execute();

      await tx
        .deleteFrom('documents')
        .where('id', '=', mutation.nodeId)
        .execute();

      await tx
        .deleteFrom('document_updates')
        .where('document_id', '=', mutation.nodeId)
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
      .where('id', '=', mutation.nodeId)
      .executeTakeFirst();

    if (!node) {
      // Make sure we don't have any data left behind
      await this.workspace.database
        .deleteFrom('node_updates')
        .where('id', '=', mutation.updateId)
        .execute();

      await this.workspace.database
        .deleteFrom('node_interactions')
        .where('node_id', '=', mutation.nodeId)
        .execute();

      await this.workspace.database
        .deleteFrom('node_reactions')
        .where('node_id', '=', mutation.nodeId)
        .execute();

      await this.workspace.database
        .deleteFrom('node_states')
        .where('id', '=', mutation.nodeId)
        .execute();

      await this.workspace.database
        .deleteFrom('documents')
        .where('id', '=', mutation.nodeId)
        .execute();

      await this.workspace.database
        .deleteFrom('document_updates')
        .where('document_id', '=', mutation.nodeId)
        .execute();

      return true;
    }

    const updateRow = await this.workspace.database
      .selectFrom('node_updates')
      .selectAll()
      .where('id', '=', mutation.updateId)
      .executeTakeFirst();

    if (!updateRow) {
      return true;
    }

    const nodeUpdates = await this.workspace.database
      .selectFrom('node_updates')
      .selectAll()
      .where('node_id', '=', mutation.nodeId)
      .orderBy('id', 'asc')
      .execute();

    const state = await this.workspace.database
      .selectFrom('node_states')
      .selectAll()
      .where('id', '=', mutation.nodeId)
      .executeTakeFirst();

    const ydoc = new YDoc(state?.state);
    for (const nodeUpdate of nodeUpdates) {
      if (nodeUpdate.id === mutation.updateId) {
        continue;
      }

      if (nodeUpdate.data) {
        ydoc.applyUpdate(nodeUpdate.data);
      }
    }

    const attributes = ydoc.getObject<NodeAttributes>();
    const model = getNodeModel(attributes.type);
    const nodeText = model.extractNodeText(node.id, attributes);
    const localRevision = BigInt(node.local_revision) + BigInt(1);

    const updatedNode = await this.workspace.database
      .transaction()
      .execute(async (trx) => {
        const updatedNode = await trx
          .updateTable('nodes')
          .returningAll()
          .set({
            attributes: JSON.stringify(attributes),
            local_revision: localRevision,
          })
          .where('id', '=', mutation.nodeId)
          .where('local_revision', '=', node.local_revision)
          .executeTakeFirst();

        if (!updatedNode) {
          return undefined;
        }

        await trx
          .deleteFrom('node_updates')
          .where('id', '=', mutation.updateId)
          .execute();

        if (nodeText) {
          await trx
            .insertInto('node_texts')
            .values({
              id: node.id,
              name: nodeText.name,
              attributes: nodeText.attributes,
            })
            .execute();
        }
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
      .where('id', '=', mutation.nodeId)
      .executeTakeFirst();

    if (!tombstone) {
      return;
    }

    const state = await this.workspace.database
      .selectFrom('node_states')
      .selectAll()
      .where('id', '=', mutation.nodeId)
      .executeTakeFirst();

    const nodeUpdates = await this.workspace.database
      .selectFrom('node_updates')
      .selectAll()
      .where('node_id', '=', mutation.nodeId)
      .orderBy('id', 'asc')
      .execute();

    const ydoc = new YDoc(state?.state);
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
          .where('id', '=', mutation.nodeId)
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
