import {
  extractNodeCollaborators,
  generateId,
  IdType,
  NodeAttributes,
  NodeMutationContext,
  NodeRole,
  registry,
} from '@colanode/core';
import { decodeState, YDoc } from '@colanode/crdt';
import { Transaction } from 'kysely';
import { cloneDeep } from 'lodash-es';

import { jobService } from '@/services/job-service';
import { database } from '@/data/database';
import {
  CreateNode,
  CreateCollaboration,
  CreateTransaction,
  DatabaseSchema,
  SelectUser,
  SelectCollaboration,
} from '@/data/schema';
import { eventBus } from '@/lib/event-bus';
import { fetchNodeAncestors, mapNode } from '@/lib/nodes';
import { createLogger } from '@/lib/logger';
import {
  ApplyCreateTransactionInput,
  ApplyCreateTransactionOutput,
  ApplyDeleteTransactionInput,
  ApplyDeleteTransactionOutput,
  ApplyUpdateTransactionInput,
  ApplyUpdateTransactionOutput,
  CreateNodeInput,
  CreateNodeOutput,
  UpdateNodeInput,
  UpdateNodeOutput,
} from '@/types/nodes';

const UPDATE_RETRIES_LIMIT = 10;

type UpdateResult<T> = {
  type: 'success' | 'error' | 'retry';
  output: T | null;
};

type CollaboratorChangeResult = {
  addedCollaborators: Record<string, NodeRole>;
  updatedCollaborators: Record<string, NodeRole>;
  removedCollaborators: Record<string, NodeRole>;
};

class NodeService {
  private readonly logger = createLogger('node-service');

  public async createNode(
    input: CreateNodeInput
  ): Promise<CreateNodeOutput | null> {
    const model = registry.getModel(input.attributes.type);
    const ydoc = new YDoc();
    const update = ydoc.updateAttributes(model.schema, input.attributes);
    const attributes = ydoc.getAttributes<NodeAttributes>();
    const attributesJson = JSON.stringify(attributes);

    const date = new Date();
    const transactionId = generateId(IdType.Transaction);

    const createNode: CreateNode = {
      id: input.nodeId,
      root_id: input.rootId,
      workspace_id: input.workspaceId,
      attributes: attributesJson,
      created_at: date,
      created_by: input.userId,
      transaction_id: transactionId,
    };

    const createTransaction: CreateTransaction = {
      id: transactionId,
      root_id: input.rootId,
      node_id: input.nodeId,
      workspace_id: input.workspaceId,
      operation: 'create',
      data: update,
      created_at: date,
      created_by: input.userId,
      server_created_at: date,
    };

    try {
      const { createdNode, createdTransaction, createdCollaborations } =
        await this.applyDatabaseCreateTransaction(
          attributes,
          createNode,
          createTransaction
        );

      eventBus.publish({
        type: 'node_created',
        nodeId: input.nodeId,
        nodeType: input.attributes.type,
        rootId: input.rootId,
        workspaceId: input.workspaceId,
      });

      for (const createdCollaboration of createdCollaborations) {
        eventBus.publish({
          type: 'collaboration_created',
          collaboratorId: createdCollaboration.collaborator_id,
          nodeId: input.nodeId,
          workspaceId: input.workspaceId,
        });
      }

      return {
        node: createdNode,
        transaction: createdTransaction,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to create node transaction');
      return null;
    }
  }

  public async updateNode(
    input: UpdateNodeInput
  ): Promise<UpdateNodeOutput | null> {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      const result = await this.tryUpdateNode(input);

      if (result.type === 'success') {
        return result.output;
      }

      if (result.type === 'error') {
        return null;
      }
    }

    return null;
  }

  private async tryUpdateNode(
    input: UpdateNodeInput
  ): Promise<UpdateResult<UpdateNodeOutput>> {
    const ancestorRows = await fetchNodeAncestors(input.nodeId);
    const ancestors = ancestorRows.map(mapNode);

    const node = ancestors.find((ancestor) => ancestor.id === input.nodeId);
    if (!node) {
      return { type: 'error', output: null };
    }

    const previousTransactions = await database
      .selectFrom('transactions')
      .selectAll()
      .where('node_id', '=', input.nodeId)
      .orderBy('id', 'asc')
      .execute();

    const ydoc = new YDoc();
    for (const transaction of previousTransactions) {
      if (transaction.data === null) {
        return { type: 'error', output: null };
      }

      ydoc.applyUpdate(transaction.data);
    }

    const currentAttributes = ydoc.getAttributes<NodeAttributes>();
    const updatedAttributes = input.updater(cloneDeep(currentAttributes));
    if (!updatedAttributes) {
      return { type: 'error', output: null };
    }

    const model = registry.getModel(updatedAttributes.type);
    const update = ydoc.updateAttributes(model.schema, updatedAttributes);

    const attributes = ydoc.getAttributes<NodeAttributes>();
    const attributesJson = JSON.stringify(attributes);

    const date = new Date();
    const transactionId = generateId(IdType.Transaction);

    const collaboratorChanges = this.checkCollaboratorChanges(
      node.attributes,
      attributes
    );

    try {
      const {
        updatedNode,
        createdTransaction,
        createdCollaborations,
        updatedCollaborations,
      } = await database.transaction().execute(async (trx) => {
        const updatedNode = await trx
          .updateTable('nodes')
          .returningAll()
          .set({
            attributes: attributesJson,
            updated_at: date,
            updated_by: input.userId,
            transaction_id: transactionId,
          })
          .where('id', '=', input.nodeId)
          .where('transaction_id', '=', node.transactionId)
          .executeTakeFirst();

        if (!updatedNode) {
          throw new Error('Failed to update node');
        }

        const createdTransaction = await trx
          .insertInto('transactions')
          .returningAll()
          .values({
            id: transactionId,
            node_id: input.nodeId,
            root_id: node.rootId,
            workspace_id: input.workspaceId,
            operation: 'update',
            data: update,
            created_at: date,
            created_by: input.userId,
            server_created_at: date,
          })
          .executeTakeFirst();

        if (!createdTransaction) {
          throw new Error('Failed to create transaction');
        }

        const { createdCollaborations, updatedCollaborations } =
          await this.applyCollaboratorUpdates(
            trx,
            input.nodeId,
            node.rootId,
            input.userId,
            input.workspaceId,
            collaboratorChanges
          );

        return {
          updatedNode,
          createdTransaction,
          createdCollaborations,
          updatedCollaborations,
        };
      });

      eventBus.publish({
        type: 'node_updated',
        nodeId: input.nodeId,
        nodeType: node.type,
        rootId: node.rootId,
        workspaceId: input.workspaceId,
      });

      for (const createdCollaboration of createdCollaborations) {
        eventBus.publish({
          type: 'collaboration_created',
          collaboratorId: createdCollaboration.collaborator_id,
          nodeId: input.nodeId,
          workspaceId: input.workspaceId,
        });
      }

      for (const updatedCollaboration of updatedCollaborations) {
        eventBus.publish({
          type: 'collaboration_updated',
          collaboratorId: updatedCollaboration.collaborator_id,
          nodeId: input.nodeId,
          workspaceId: input.workspaceId,
        });
      }

      return {
        type: 'success',
        output: {
          node: updatedNode,
          transaction: createdTransaction,
        },
      };
    } catch {
      return { type: 'retry', output: null };
    }
  }

  public async applyCreateTransaction(
    user: SelectUser,
    input: ApplyCreateTransactionInput
  ): Promise<ApplyCreateTransactionOutput | null> {
    const ydoc = new YDoc();
    ydoc.applyUpdate(input.data);
    const attributes = ydoc.getAttributes<NodeAttributes>();

    const ancestorRows = attributes.parentId
      ? await fetchNodeAncestors(attributes.parentId)
      : [];

    const ancestors = ancestorRows.map(mapNode);
    const context = new NodeMutationContext(
      user.account_id,
      user.workspace_id,
      user.id,
      user.role,
      ancestors
    );

    const model = registry.getModel(attributes.type);
    if (!model.schema.safeParse(attributes).success) {
      return null;
    }

    if (!model.canCreate(context, attributes)) {
      return null;
    }

    const createNode: CreateNode = {
      id: input.nodeId,
      root_id: input.rootId,
      attributes: JSON.stringify(attributes),
      workspace_id: context.workspaceId,
      created_at: input.createdAt,
      created_by: context.userId,
      transaction_id: input.id,
    };

    const createTransaction: CreateTransaction = {
      id: input.id,
      node_id: input.nodeId,
      root_id: input.rootId,
      workspace_id: context.workspaceId,
      operation: 'create',
      data:
        typeof input.data === 'string' ? decodeState(input.data) : input.data,
      created_at: input.createdAt,
      created_by: context.userId,
      server_created_at: new Date(),
    };

    try {
      const { createdNode, createdTransaction, createdCollaborations } =
        await this.applyDatabaseCreateTransaction(
          attributes,
          createNode,
          createTransaction
        );

      eventBus.publish({
        type: 'node_created',
        nodeId: input.nodeId,
        nodeType: attributes.type,
        rootId: input.rootId,
        workspaceId: context.workspaceId,
      });

      for (const createdCollaboration of createdCollaborations) {
        eventBus.publish({
          type: 'collaboration_created',
          collaboratorId: createdCollaboration.collaborator_id,
          nodeId: input.nodeId,
          workspaceId: context.workspaceId,
        });
      }

      return {
        node: createdNode,
        transaction: createdTransaction,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to apply node create transaction');
      return null;
    }
  }

  public async applyUpdateTransaction(
    user: SelectUser,
    input: ApplyUpdateTransactionInput
  ): Promise<ApplyUpdateTransactionOutput | null> {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      const result = await this.tryApplyUpdateTransaction(user, input);

      if (result.type === 'success') {
        return result.output;
      }

      if (result.type === 'error') {
        return null;
      }
    }

    return null;
  }

  private async tryApplyUpdateTransaction(
    user: SelectUser,
    input: ApplyUpdateTransactionInput
  ): Promise<UpdateResult<ApplyUpdateTransactionOutput>> {
    const ancestorRows = await fetchNodeAncestors(input.nodeId);
    const ancestors = ancestorRows.map(mapNode);

    const node = ancestors.find((ancestor) => ancestor.id === input.nodeId);
    if (!node) {
      return { type: 'error', output: null };
    }

    const previousTransactions = await database
      .selectFrom('transactions')
      .selectAll()
      .where('node_id', '=', input.nodeId)
      .orderBy('version', 'asc')
      .execute();

    const ydoc = new YDoc();
    for (const previousTransaction of previousTransactions) {
      if (previousTransaction.data === null) {
        return { type: 'error', output: null };
      }

      ydoc.applyUpdate(previousTransaction.data);
    }

    ydoc.applyUpdate(input.data);

    const attributes = ydoc.getAttributes<NodeAttributes>();
    const attributesJson = JSON.stringify(attributes);
    const model = registry.getModel(attributes.type);
    if (!model.schema.safeParse(attributes).success) {
      return { type: 'error', output: null };
    }

    const context = new NodeMutationContext(
      user.account_id,
      user.workspace_id,
      user.id,
      user.role,
      ancestors
    );

    if (!model.canUpdate(context, node, attributes)) {
      return { type: 'error', output: null };
    }

    const collaboratorChanges = this.checkCollaboratorChanges(
      node.attributes,
      attributes
    );

    try {
      const {
        updatedNode,
        createdTransaction,
        createdCollaborations,
        updatedCollaborations,
      } = await database.transaction().execute(async (trx) => {
        const updatedNode = await trx
          .updateTable('nodes')
          .returningAll()
          .set({
            attributes: attributesJson,
            updated_at: input.createdAt,
            updated_by: input.userId,
            transaction_id: input.id,
          })
          .where('id', '=', input.nodeId)
          .where('transaction_id', '=', node.transactionId)
          .executeTakeFirst();

        if (!updatedNode) {
          throw new Error('Failed to update node');
        }

        const createdTransaction = await trx
          .insertInto('transactions')
          .returningAll()
          .values({
            id: input.id,
            node_id: input.nodeId,
            root_id: input.rootId,
            workspace_id: context.workspaceId,
            operation: 'update',
            data:
              typeof input.data === 'string'
                ? decodeState(input.data)
                : input.data,
            created_at: input.createdAt,
            created_by: input.userId,
            server_created_at: new Date(),
          })
          .executeTakeFirst();

        if (!createdTransaction) {
          throw new Error('Failed to create transaction');
        }

        const { createdCollaborations, updatedCollaborations } =
          await this.applyCollaboratorUpdates(
            trx,
            input.nodeId,
            input.rootId,
            input.userId,
            context.workspaceId,
            collaboratorChanges
          );

        return {
          updatedNode,
          createdTransaction,
          createdCollaborations,
          updatedCollaborations,
        };
      });

      eventBus.publish({
        type: 'node_updated',
        nodeId: input.nodeId,
        nodeType: node.type,
        rootId: node.rootId,
        workspaceId: context.workspaceId,
      });

      for (const createdCollaboration of createdCollaborations) {
        eventBus.publish({
          type: 'collaboration_created',
          collaboratorId: createdCollaboration.collaborator_id,
          nodeId: input.nodeId,
          workspaceId: context.workspaceId,
        });
      }

      for (const updatedCollaboration of updatedCollaborations) {
        eventBus.publish({
          type: 'collaboration_updated',
          collaboratorId: updatedCollaboration.collaborator_id,
          nodeId: input.nodeId,
          workspaceId: context.workspaceId,
        });
      }

      return {
        type: 'success',
        output: {
          node: updatedNode,
          transaction: createdTransaction,
        },
      };
    } catch {
      return { type: 'retry', output: null };
    }
  }

  public async applyDeleteTransaction(
    user: SelectUser,
    input: ApplyDeleteTransactionInput
  ): Promise<ApplyDeleteTransactionOutput | null> {
    const ancestorRows = await fetchNodeAncestors(input.nodeId);
    const ancestors = ancestorRows.map(mapNode);
    const node = ancestors.find((ancestor) => ancestor.id === input.nodeId);
    if (!node) {
      return null;
    }

    const model = registry.getModel(node.attributes.type);
    const context = new NodeMutationContext(
      user.account_id,
      user.workspace_id,
      user.id,
      user.role,
      ancestors
    );

    if (!model.canDelete(context, node)) {
      return null;
    }

    const { deletedNode, createdTransaction, updatedCollaborations } =
      await database.transaction().execute(async (trx) => {
        const deletedNode = await trx
          .deleteFrom('nodes')
          .returningAll()
          .where('id', '=', input.nodeId)
          .executeTakeFirst();

        if (!deletedNode) {
          throw new Error('Failed to delete node');
        }

        await trx
          .deleteFrom('transactions')
          .where('node_id', '=', input.nodeId)
          .execute();

        const createdTransaction = await trx
          .insertInto('transactions')
          .returningAll()
          .values({
            id: input.id,
            node_id: input.nodeId,
            root_id: input.rootId,
            workspace_id: user.workspace_id,
            operation: 'delete',
            created_at: input.createdAt,
            created_by: user.id,
            server_created_at: new Date(),
          })
          .executeTakeFirst();

        if (!createdTransaction) {
          throw new Error('Failed to create transaction');
        }

        const updatedCollaborations = await trx
          .updateTable('collaborations')
          .set({
            deleted_at: new Date(),
            deleted_by: user.id,
          })
          .returningAll()
          .where('node_id', '=', input.nodeId)
          .execute();

        return {
          deletedNode,
          createdTransaction,
          updatedCollaborations,
        };
      });

    eventBus.publish({
      type: 'node_deleted',
      nodeId: input.nodeId,
      nodeType: node.type,
      rootId: node.rootId,
      workspaceId: user.workspace_id,
    });

    for (const updatedCollaboration of updatedCollaborations) {
      eventBus.publish({
        type: 'collaboration_updated',
        collaboratorId: updatedCollaboration.collaborator_id,
        nodeId: input.nodeId,
        workspaceId: user.workspace_id,
      });
    }

    await jobService.addJob({
      type: 'clean_node_data',
      nodeId: input.nodeId,
      workspaceId: user.workspace_id,
    });

    return {
      node: deletedNode,
      transaction: createdTransaction,
    };
  }

  private async applyDatabaseCreateTransaction(
    attributes: NodeAttributes,
    node: CreateNode,
    transaction: CreateTransaction
  ) {
    const collaborationsToCreate: CreateCollaboration[] = Object.entries(
      extractNodeCollaborators(attributes)
    ).map(([userId, role]) => ({
      collaborator_id: userId,
      node_id: node.id,
      workspace_id: node.workspace_id,
      role,
      created_at: new Date(),
      created_by: transaction.created_by,
    }));

    return await database.transaction().execute(async (trx) => {
      const createdNode = await trx
        .insertInto('nodes')
        .returningAll()
        .values(node)
        .executeTakeFirst();

      if (!createdNode) {
        throw new Error('Failed to create node');
      }

      const createdTransaction = await trx
        .insertInto('transactions')
        .returningAll()
        .values(transaction)
        .executeTakeFirst();

      if (!createdTransaction) {
        throw new Error('Failed to create transaction');
      }

      if (collaborationsToCreate.length > 0) {
        const createdCollaborations = await trx
          .insertInto('collaborations')
          .returningAll()
          .values(collaborationsToCreate)
          .execute();

        if (createdCollaborations.length !== collaborationsToCreate.length) {
          throw new Error('Failed to create collaborations');
        }

        return { createdNode, createdTransaction, createdCollaborations };
      }

      return { createdNode, createdTransaction, createdCollaborations: [] };
    });
  }

  private async applyCollaboratorUpdates(
    transaction: Transaction<DatabaseSchema>,
    nodeId: string,
    rootId: string,
    userId: string,
    workspaceId: string,
    updateResult: CollaboratorChangeResult
  ) {
    const createdCollaborations: SelectCollaboration[] = [];
    const updatedCollaborations: SelectCollaboration[] = [];

    for (const [collaboratorId, role] of Object.entries(
      updateResult.addedCollaborators
    )) {
      const createdCollaboration = await transaction
        .insertInto('collaborations')
        .returningAll()
        .values({
          collaborator_id: collaboratorId,
          node_id: nodeId,
          workspace_id: workspaceId,
          role,
          created_at: new Date(),
          created_by: userId,
        })
        .onConflict((oc) =>
          oc.columns(['collaborator_id', 'node_id']).doUpdateSet({
            role,
            updated_at: new Date(),
            updated_by: userId,
            deleted_at: null,
            deleted_by: null,
          })
        )
        .executeTakeFirst();

      if (!createdCollaboration) {
        throw new Error('Failed to create collaboration');
      }

      createdCollaborations.push(createdCollaboration);
    }

    for (const [collaboratorId, role] of Object.entries(
      updateResult.updatedCollaborators
    )) {
      const updatedCollaboration = await transaction
        .updateTable('collaborations')
        .returningAll()
        .set({
          role,
          updated_at: new Date(),
          updated_by: userId,
          deleted_at: null,
          deleted_by: null,
        })
        .where('collaborator_id', '=', collaboratorId)
        .where('node_id', '=', nodeId)
        .executeTakeFirst();

      if (!updatedCollaboration) {
        throw new Error('Failed to update collaboration');
      }

      updatedCollaborations.push(updatedCollaboration);
    }

    const removedCollaboratorIds = Object.keys(
      updateResult.removedCollaborators
    );

    if (removedCollaboratorIds.length > 0) {
      const removedCollaborations = await transaction
        .updateTable('collaborations')
        .returningAll()
        .set({
          deleted_at: new Date(),
          deleted_by: userId,
        })
        .where('collaborator_id', 'in', removedCollaboratorIds)
        .where('node_id', '=', nodeId)
        .execute();

      if (removedCollaborations.length !== removedCollaboratorIds.length) {
        throw new Error('Failed to remove collaborations');
      }

      updatedCollaborations.push(...removedCollaborations);
    }

    return { createdCollaborations, updatedCollaborations };
  }

  private checkCollaboratorChanges(
    beforeAttributes: NodeAttributes,
    afterAttributes: NodeAttributes
  ): CollaboratorChangeResult {
    const beforeCollaborators = extractNodeCollaborators(beforeAttributes);
    const afterCollaborators = extractNodeCollaborators(afterAttributes);

    const addedCollaborators: Record<string, NodeRole> = {};
    const updatedCollaborators: Record<string, NodeRole> = {};
    const removedCollaborators: Record<string, NodeRole> = {};

    // Check for added and updated collaborators
    for (const [userId, newRole] of Object.entries(afterCollaborators)) {
      if (!(userId in beforeCollaborators)) {
        addedCollaborators[userId] = newRole;
      } else if (beforeCollaborators[userId] !== newRole) {
        updatedCollaborators[userId] = newRole;
      }
    }

    // Check for removed collaborators
    for (const [userId, oldRole] of Object.entries(beforeCollaborators)) {
      if (!(userId in afterCollaborators)) {
        removedCollaborators[userId] = oldRole;
      }
    }

    return {
      addedCollaborators,
      updatedCollaborators,
      removedCollaborators,
    };
  }
}

export const nodeService = new NodeService();
