import {
  generateId,
  IdType,
  LocalCreateTransaction,
  LocalDeleteTransaction,
  LocalUpdateTransaction,
  Node,
  NodeAttributes,
  NodeMutationContext,
  registry,
  ServerCreateTransaction,
  ServerDeleteTransaction,
  ServerTransaction,
  ServerUpdateTransaction,
} from '@colanode/core';
import { decodeState, YDoc } from '@colanode/crdt';

import { createDebugger } from '@/main/debugger';
import { SelectWorkspace } from '@/main/data/app/schema';
import { databaseService } from '@/main/data/database-service';
import {
  SelectMutation,
  SelectNode,
  SelectTransaction,
} from '@/main/data/workspace/schema';
import { interactionService } from '@/main/services/interaction-service';
import { fetchNodeAncestors, mapNode, mapTransaction } from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';

const UPDATE_RETRIES_LIMIT = 20;

export type CreateNodeInput = {
  id: string;
  attributes: NodeAttributes;
};

export type UpdateNodeResult =
  | 'success'
  | 'not_found'
  | 'unauthorized'
  | 'failed'
  | 'invalid_attributes';

class NodeService {
  private readonly debug = createDebugger('service:node');

  public async fetchNode(nodeId: string, userId: string): Promise<Node | null> {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const nodeRow = await workspaceDatabase
      .selectFrom('nodes')
      .where('id', '=', nodeId)
      .selectAll()
      .executeTakeFirst();

    if (!nodeRow) {
      return null;
    }

    return mapNode(nodeRow);
  }

  public async createNode(
    userId: string,
    input: CreateNodeInput | CreateNodeInput[]
  ) {
    this.debug(`Creating ${Array.isArray(input) ? 'nodes' : 'node'}`);
    const workspace = await this.fetchWorkspace(userId);

    const inputs = Array.isArray(input) ? input : [input];
    const createdNodes: SelectNode[] = [];
    const createdMutations: SelectMutation[] = [];

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    await workspaceDatabase.transaction().execute(async (transaction) => {
      for (const inputItem of inputs) {
        const model = registry.getModel(inputItem.attributes.type);
        if (!model.schema.safeParse(inputItem.attributes).success) {
          throw new Error('Invalid attributes');
        }

        let ancestors: Node[] = [];
        if (inputItem.attributes.parentId) {
          const ancestorRows = await fetchNodeAncestors(
            transaction,
            inputItem.attributes.parentId
          );
          ancestors = ancestorRows.map(mapNode);
        }

        const rootId = ancestors[0]?.id ?? inputItem.id;
        const context = new NodeMutationContext(
          workspace.account_id,
          workspace.workspace_id,
          userId,
          workspace.role,
          ancestors
        );

        if (!model.canCreate(context, inputItem.attributes)) {
          throw new Error('Insufficient permissions');
        }

        const ydoc = new YDoc();
        const update = ydoc.updateAttributes(
          model.schema,
          inputItem.attributes
        );

        const createdAt = new Date().toISOString();
        const transactionId = generateId(IdType.Transaction);

        const name = model.getName(inputItem.id, inputItem.attributes);
        const text = model.getText(inputItem.id, inputItem.attributes);

        const createdNode = await transaction
          .insertInto('nodes')
          .returningAll()
          .values({
            id: inputItem.id,
            root_id: rootId,
            attributes: JSON.stringify(inputItem.attributes),
            created_at: createdAt,
            created_by: context.userId,
            transaction_id: transactionId,
          })
          .executeTakeFirst();

        if (!createdNode) {
          throw new Error('Failed to create node');
        }

        createdNodes.push(createdNode);

        const createdTransaction = await transaction
          .insertInto('transactions')
          .returningAll()
          .values({
            id: transactionId,
            node_id: inputItem.id,
            root_id: rootId,
            operation: 'create',
            data: update,
            created_at: createdAt,
            created_by: context.userId,
            version: 0n,
          })
          .executeTakeFirst();

        if (!createdTransaction) {
          throw new Error('Failed to create transaction');
        }

        const mutation = await transaction
          .insertInto('mutations')
          .returningAll()
          .values({
            id: generateId(IdType.Mutation),
            node_id: inputItem.id,
            type: 'apply_create_transaction',
            data: JSON.stringify(mapTransaction(createdTransaction)),
            created_at: createdAt,
            retries: 0,
          })
          .executeTakeFirst();

        if (!mutation) {
          throw new Error('Failed to create mutation');
        }

        createdMutations.push(mutation);

        if (name) {
          await transaction
            .insertInto('node_names')
            .values({ id: inputItem.id, name })
            .execute();
        }

        if (text) {
          await transaction
            .insertInto('node_texts')
            .values({ id: inputItem.id, text })
            .execute();
        }
      }
    });

    for (const createdNode of createdNodes) {
      this.debug(
        `Created node ${createdNode.id} with type ${createdNode.type}`
      );

      eventBus.publish({
        type: 'node_created',
        userId,
        node: mapNode(createdNode),
      });
    }

    for (const createdMutation of createdMutations) {
      this.debug(`Created mutation ${createdMutation.id}`);

      eventBus.publish({
        type: 'mutation_created',
        userId,
      });
    }
  }

  public async updateNode(
    nodeId: string,
    userId: string,
    updater: (attributes: NodeAttributes) => NodeAttributes
  ): Promise<UpdateNodeResult> {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      const result = await this.tryUpdateNode(nodeId, userId, updater);
      if (result) {
        return result;
      }
    }

    return 'failed';
  }

  private async tryUpdateNode(
    nodeId: string,
    userId: string,
    updater: (attributes: NodeAttributes) => NodeAttributes
  ): Promise<UpdateNodeResult | null> {
    this.debug(`Updating node ${nodeId}`);

    const workspace = await this.fetchWorkspace(userId);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const ancestorRows = await fetchNodeAncestors(workspaceDatabase, nodeId);
    const nodeRow = ancestorRows.find((ancestor) => ancestor.id === nodeId);
    if (!nodeRow) {
      return 'not_found';
    }

    const ancestors = ancestorRows.map(mapNode);
    const node = mapNode(nodeRow);

    if (!node) {
      return 'not_found';
    }

    const context = new NodeMutationContext(
      workspace.account_id,
      workspace.workspace_id,
      userId,
      workspace.role,
      ancestors
    );

    const transactionId = generateId(IdType.Transaction);
    const updatedAt = new Date().toISOString();
    const updatedAttributes = updater(node.attributes);

    const model = registry.getModel(node.type);
    if (!model.schema.safeParse(updatedAttributes).success) {
      return 'invalid_attributes';
    }

    if (!model.canUpdate(context, node, updatedAttributes)) {
      return 'unauthorized';
    }

    const ydoc = new YDoc();
    const previousTransactions = await workspaceDatabase
      .selectFrom('transactions')
      .where('node_id', '=', nodeId)
      .selectAll()
      .execute();

    for (const previousTransaction of previousTransactions) {
      if (previousTransaction.data === null) {
        return 'not_found';
      }

      ydoc.applyUpdate(previousTransaction.data);
    }

    const update = ydoc.updateAttributes(model.schema, updatedAttributes);
    const name = model.getName(nodeId, updatedAttributes);
    const text = model.getText(nodeId, updatedAttributes);

    const { updatedNode, createdMutation } = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const updatedNode = await trx
          .updateTable('nodes')
          .returningAll()
          .set({
            attributes: JSON.stringify(ydoc.getAttributes()),
            updated_at: updatedAt,
            updated_by: context.userId,
            transaction_id: transactionId,
          })
          .where('id', '=', nodeId)
          .where('transaction_id', '=', node.transactionId)
          .executeTakeFirst();

        if (!updatedNode) {
          return { updatedNode: undefined };
        }
        const createdTransaction = await trx
          .insertInto('transactions')
          .returningAll()
          .values({
            id: transactionId,
            node_id: nodeId,
            root_id: node.rootId,
            operation: 'update',
            data: update,
            created_at: updatedAt,
            created_by: context.userId,
            version: 0n,
          })
          .executeTakeFirst();

        if (!createdTransaction) {
          throw new Error('Failed to create transaction');
        }

        const createdMutation = await trx
          .insertInto('mutations')
          .returningAll()
          .values({
            id: generateId(IdType.Mutation),
            node_id: nodeId,
            type: 'apply_update_transaction',
            data: JSON.stringify(mapTransaction(createdTransaction)),
            created_at: updatedAt,
            retries: 0,
          })
          .executeTakeFirst();

        if (!createdMutation) {
          throw new Error('Failed to create mutation');
        }

        if (name !== undefined) {
          await trx.deleteFrom('node_names').where('id', '=', nodeId).execute();
        }

        if (name) {
          await trx
            .insertInto('node_names')
            .values({ id: nodeId, name })
            .execute();
        }

        if (text !== undefined) {
          await trx.deleteFrom('node_texts').where('id', '=', nodeId).execute();
        }

        if (text) {
          await trx
            .insertInto('node_texts')
            .values({ id: nodeId, text })
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
        userId,
        node: mapNode(updatedNode),
      });
    } else {
      this.debug(`Failed to update node ${nodeId}`);
    }

    if (createdMutation) {
      this.debug(`Created mutation ${createdMutation.id} for node ${nodeId}`);

      eventBus.publish({
        type: 'mutation_created',
        userId,
      });
    } else {
      this.debug(`Failed to create mutation for node ${nodeId}`);
    }

    if (updatedNode) {
      return 'success';
    }

    return null;
  }

  public async deleteNode(nodeId: string, userId: string) {
    const workspace = await this.fetchWorkspace(userId);
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const ancestorRows = await fetchNodeAncestors(workspaceDatabase, nodeId);
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

    const { deletedNode, createdMutation } = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const deletedNode = await trx
          .deleteFrom('nodes')
          .returningAll()
          .where('id', '=', nodeId)
          .executeTakeFirst();

        if (!deletedNode) {
          return { deletedNode: undefined };
        }

        await trx
          .deleteFrom('transactions')
          .where('node_id', '=', nodeId)
          .execute();

        await trx
          .deleteFrom('collaborations')
          .where('node_id', '=', nodeId)
          .execute();

        await trx
          .deleteFrom('interaction_events')
          .where('node_id', '=', nodeId)
          .execute();

        await trx
          .deleteFrom('interactions')
          .where('node_id', '=', nodeId)
          .execute();

        await trx.deleteFrom('node_names').where('id', '=', nodeId).execute();
        await trx.deleteFrom('node_texts').where('id', '=', nodeId).execute();

        const createdTransaction = await trx
          .insertInto('transactions')
          .returningAll()
          .values({
            id: generateId(IdType.Transaction),
            node_id: nodeId,
            root_id: node.rootId,
            operation: 'delete',
            data: null,
            created_at: new Date().toISOString(),
            created_by: context.userId,
            version: 0n,
          })
          .executeTakeFirst();

        if (!createdTransaction) {
          throw new Error('Failed to create transaction');
        }

        const createdMutation = await trx
          .insertInto('mutations')
          .returningAll()
          .values({
            id: generateId(IdType.Mutation),
            node_id: nodeId,
            type: 'apply_delete_transaction',
            data: JSON.stringify(mapTransaction(createdTransaction)),
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
        userId,
        node: mapNode(deletedNode),
      });
    } else {
      this.debug(`Failed to delete node ${nodeId}`);
    }

    if (createdMutation) {
      this.debug(`Created mutation ${createdMutation.id} for node ${nodeId}`);

      eventBus.publish({
        type: 'mutation_created',
        userId,
      });
    } else {
      this.debug(`Failed to create mutation for node ${nodeId}`);
    }
  }

  public async applyServerTransaction(
    userId: string,
    transaction: ServerTransaction
  ) {
    if (transaction.operation === 'create') {
      await this.applyServerCreateTransaction(userId, transaction);
    } else if (transaction.operation === 'update') {
      await this.applyServerUpdateTransaction(userId, transaction);
    } else if (transaction.operation === 'delete') {
      await this.applyServerDeleteTransaction(userId, transaction);
    }
  }

  public async replaceTransactions(
    userId: string,
    nodeId: string,
    transactions: ServerTransaction[],
    transactionCursor: bigint
  ): Promise<boolean> {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      const result = await this.tryReplaceTransactions(
        userId,
        nodeId,
        transactions,
        transactionCursor
      );

      if (result !== null) {
        return result;
      }
    }

    return false;
  }

  public async tryReplaceTransactions(
    userId: string,
    nodeId: string,
    transactions: ServerTransaction[],
    transactionCursor: bigint
  ): Promise<boolean | null> {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const firstTransaction = transactions[0];
    if (!firstTransaction || firstTransaction.operation !== 'create') {
      return false;
    }

    if (transactionCursor < BigInt(firstTransaction.version)) {
      return false;
    }

    const lastTransaction = transactions[transactions.length - 1];
    if (!lastTransaction) {
      return false;
    }

    const ydoc = new YDoc();
    for (const transaction of transactions) {
      if (transaction.operation === 'delete') {
        await this.applyServerDeleteTransaction(userId, transaction);
        return true;
      }

      ydoc.applyUpdate(transaction.data);
    }

    const attributes = ydoc.getAttributes<NodeAttributes>();
    const model = registry.getModel(attributes.type);
    if (!model) {
      return false;
    }

    const attributesJson = JSON.stringify(attributes);
    const name = model.getName(nodeId, attributes);
    const text = model.getText(nodeId, attributes);

    const existingNode = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', nodeId)
      .executeTakeFirst();

    if (existingNode) {
      const updatedNode = await workspaceDatabase
        .transaction()
        .execute(async (trx) => {
          const updatedNode = await trx
            .updateTable('nodes')
            .returningAll()
            .set({
              attributes: attributesJson,
              updated_at:
                firstTransaction.id !== lastTransaction.id
                  ? lastTransaction.createdAt
                  : null,
              updated_by:
                firstTransaction.id !== lastTransaction.id
                  ? lastTransaction.createdBy
                  : null,
              transaction_id: lastTransaction.id,
            })
            .where('id', '=', nodeId)
            .where('transaction_id', '=', existingNode.transaction_id)
            .executeTakeFirst();

          if (!updatedNode) {
            return undefined;
          }

          await trx
            .deleteFrom('transactions')
            .where('node_id', '=', nodeId)
            .execute();

          await trx
            .insertInto('transactions')
            .values(
              transactions.map((t) => ({
                id: t.id,
                node_id: t.nodeId,
                root_id: t.rootId,
                operation: t.operation,
                data:
                  t.operation !== 'delete' && t.data
                    ? decodeState(t.data)
                    : null,
                created_at: t.createdAt,
                created_by: t.createdBy,
                retry_count: 0,
                status: 'synced',
                version: BigInt(t.version),
                server_created_at: t.serverCreatedAt,
              }))
            )
            .execute();

          await trx.deleteFrom('node_names').where('id', '=', nodeId).execute();
          await trx.deleteFrom('node_texts').where('id', '=', nodeId).execute();

          if (name) {
            await trx
              .insertInto('node_names')
              .values({ id: nodeId, name })
              .execute();
          }

          if (text) {
            await trx
              .insertInto('node_texts')
              .values({ id: nodeId, text })
              .execute();
          }
        });

      if (updatedNode) {
        eventBus.publish({
          type: 'node_updated',
          userId,
          node: mapNode(updatedNode),
        });

        return true;
      }

      return null;
    }

    const createdNode = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const createdNode = await trx
          .insertInto('nodes')
          .returningAll()
          .values({
            id: nodeId,
            root_id: firstTransaction.rootId,
            attributes: attributesJson,
            created_at: firstTransaction.createdAt,
            created_by: firstTransaction.createdBy,
            updated_at:
              firstTransaction.id !== lastTransaction.id
                ? lastTransaction.createdAt
                : null,
            updated_by:
              firstTransaction.id !== lastTransaction.id
                ? lastTransaction.createdBy
                : null,
            transaction_id: lastTransaction.id,
          })
          .onConflict((b) => b.doNothing())
          .executeTakeFirst();

        if (!createdNode) {
          return undefined;
        }

        await trx
          .deleteFrom('transactions')
          .where('node_id', '=', nodeId)
          .execute();

        await trx
          .insertInto('transactions')
          .values(
            transactions.map((t) => ({
              id: t.id,
              node_id: t.nodeId,
              root_id: t.rootId,
              operation: t.operation,
              data:
                t.operation !== 'delete' && t.data ? decodeState(t.data) : null,
              created_at: t.createdAt,
              created_by: t.createdBy,
              retry_count: 0,
              status: 'synced',
              version: BigInt(t.version),
              server_created_at: t.serverCreatedAt,
            }))
          )
          .execute();

        await trx.deleteFrom('node_names').where('id', '=', nodeId).execute();
        await trx.deleteFrom('node_texts').where('id', '=', nodeId).execute();

        if (name) {
          await trx
            .insertInto('node_names')
            .values({ id: nodeId, name })
            .execute();
        }

        if (text) {
          await trx
            .insertInto('node_texts')
            .values({ id: nodeId, text })
            .execute();
        }
      });

    if (createdNode) {
      eventBus.publish({
        type: 'node_created',
        userId,
        node: mapNode(createdNode),
      });

      return true;
    }

    return null;
  }

  private async applyServerCreateTransaction(
    userId: string,
    transaction: ServerCreateTransaction
  ) {
    this.debug(
      `Applying server create transaction ${transaction.id} for node ${transaction.nodeId}`
    );

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const version = BigInt(transaction.version);
    const existingTransaction = await workspaceDatabase
      .selectFrom('transactions')
      .select(['id', 'version', 'server_created_at'])
      .where('id', '=', transaction.id)
      .executeTakeFirst();

    if (existingTransaction) {
      if (
        existingTransaction.version === version &&
        existingTransaction.server_created_at === transaction.serverCreatedAt
      ) {
        this.debug(
          `Server create transaction ${transaction.id} for node ${transaction.nodeId} is already synced`
        );
        return;
      }

      await workspaceDatabase
        .updateTable('transactions')
        .set({
          version,
          server_created_at: transaction.serverCreatedAt,
        })
        .where('id', '=', transaction.id)
        .execute();

      this.debug(
        `Server create transaction ${transaction.id} for node ${transaction.nodeId} has been synced`
      );
      return;
    }

    const ydoc = new YDoc();
    ydoc.applyUpdate(transaction.data);
    const attributes = ydoc.getAttributes<NodeAttributes>();

    const model = registry.getModel(attributes.type);
    if (!model) {
      return;
    }

    const name = model.getName(transaction.nodeId, attributes);
    const text = model.getText(transaction.nodeId, attributes);

    const { createdNode } = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const createdNode = await trx
          .insertInto('nodes')
          .returningAll()
          .values({
            id: transaction.nodeId,
            root_id: transaction.rootId,
            attributes: JSON.stringify(attributes),
            created_at: transaction.createdAt,
            created_by: transaction.createdBy,
            transaction_id: transaction.id,
          })
          .executeTakeFirst();

        await trx
          .insertInto('transactions')
          .values({
            id: transaction.id,
            node_id: transaction.nodeId,
            root_id: transaction.rootId,
            operation: 'create',
            data: decodeState(transaction.data),
            created_at: transaction.createdAt,
            created_by: transaction.createdBy,
            version,
            server_created_at: transaction.serverCreatedAt,
          })
          .execute();

        if (name) {
          await trx
            .insertInto('node_names')
            .values({ id: transaction.nodeId, name })
            .execute();
        }

        if (text) {
          await trx
            .insertInto('node_texts')
            .values({ id: transaction.nodeId, text })
            .execute();
        }

        return { createdNode };
      });

    if (!createdNode) {
      this.debug(
        `Server create transaction ${transaction.id} for node ${transaction.nodeId} is incomplete`
      );
      return;
    }

    this.debug(
      `Created node ${createdNode.id} with type ${createdNode.type} with transaction ${transaction.id}`
    );

    eventBus.publish({
      type: 'node_created',
      userId,
      node: mapNode(createdNode),
    });

    await interactionService.setInteraction(userId, createdNode.id, {
      attribute: 'lastReceivedTransactionId',
      value: transaction.id,
    });
  }

  private async applyServerUpdateTransaction(
    userId: string,
    transaction: ServerUpdateTransaction
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const version = BigInt(transaction.version);
    const existingTransaction = await workspaceDatabase
      .selectFrom('transactions')
      .select(['id', 'version', 'server_created_at'])
      .where('id', '=', transaction.id)
      .executeTakeFirst();

    if (existingTransaction) {
      if (
        existingTransaction.version === version &&
        existingTransaction.server_created_at === transaction.serverCreatedAt
      ) {
        this.debug(
          `Server update transaction ${transaction.id} for node ${transaction.nodeId} is already synced`
        );
        return;
      }

      await workspaceDatabase
        .updateTable('transactions')
        .set({
          version,
          server_created_at: transaction.serverCreatedAt,
        })
        .where('id', '=', transaction.id)
        .execute();

      this.debug(
        `Server update transaction ${transaction.id} for node ${transaction.nodeId} has been synced`
      );
      return;
    }

    const model = registry.getModel(transaction.nodeId);
    if (!model) {
      return;
    }

    const previousTransactions = await workspaceDatabase
      .selectFrom('transactions')
      .selectAll()
      .where('node_id', '=', transaction.nodeId)
      .orderBy('id', 'asc')
      .execute();

    const ydoc = new YDoc();

    for (const previousTransaction of previousTransactions) {
      if (previousTransaction.data) {
        ydoc.applyUpdate(previousTransaction.data);
      }
    }

    ydoc.applyUpdate(transaction.data);
    const attributes = ydoc.getAttributes<NodeAttributes>();

    const name = model.getName(transaction.nodeId, attributes);
    const text = model.getText(transaction.nodeId, attributes);

    const { updatedNode } = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const updatedNode = await trx
          .updateTable('nodes')
          .returningAll()
          .set({
            attributes: JSON.stringify(attributes),
            updated_at: transaction.createdAt,
            updated_by: transaction.createdBy,
            transaction_id: transaction.id,
          })
          .where('id', '=', transaction.nodeId)
          .executeTakeFirst();

        await trx
          .insertInto('transactions')
          .values({
            id: transaction.id,
            node_id: transaction.nodeId,
            root_id: transaction.rootId,
            operation: 'update',
            data: decodeState(transaction.data),
            created_at: transaction.createdAt,
            created_by: transaction.createdBy,
            version,
            server_created_at: transaction.serverCreatedAt,
          })
          .execute();

        if (name !== undefined) {
          await trx
            .deleteFrom('node_names')
            .where('id', '=', transaction.nodeId)
            .execute();
        }

        if (name) {
          await trx
            .insertInto('node_names')
            .values({ id: transaction.nodeId, name })
            .execute();
        }

        if (text !== undefined) {
          await trx
            .deleteFrom('node_texts')
            .where('id', '=', transaction.nodeId)
            .execute();
        }

        if (text) {
          await trx
            .insertInto('node_texts')
            .values({ id: transaction.nodeId, text })
            .execute();
        }

        return { updatedNode };
      });

    if (!updatedNode) {
      this.debug(
        `Server update transaction ${transaction.id} for node ${transaction.nodeId} is incomplete`
      );
      return;
    }

    this.debug(
      `Updated node ${updatedNode.id} with type ${updatedNode.type} with transaction ${transaction.id}`
    );

    eventBus.publish({
      type: 'node_updated',
      userId,
      node: mapNode(updatedNode),
    });

    await interactionService.setInteraction(userId, updatedNode.id, {
      attribute: 'lastReceivedTransactionId',
      value: transaction.id,
    });
  }

  private async applyServerDeleteTransaction(
    userId: string,
    transaction: ServerDeleteTransaction
  ) {
    this.debug(
      `Applying server delete transaction ${transaction.id} for node ${transaction.nodeId}`
    );

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const node = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', transaction.nodeId)
      .executeTakeFirst();

    if (!node) {
      return;
    }

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx
        .deleteFrom('nodes')
        .where('id', '=', transaction.nodeId)
        .execute();
      await trx
        .deleteFrom('transactions')
        .where('node_id', '=', transaction.nodeId)
        .execute();

      await trx
        .deleteFrom('interactions')
        .where('node_id', '=', transaction.nodeId)
        .execute();

      await trx
        .deleteFrom('interaction_events')
        .where('node_id', '=', transaction.nodeId)
        .execute();

      await trx
        .deleteFrom('collaborations')
        .where('node_id', '=', transaction.nodeId)
        .execute();

      await trx
        .deleteFrom('node_names')
        .where('id', '=', transaction.nodeId)
        .execute();

      await trx
        .deleteFrom('node_texts')
        .where('id', '=', transaction.nodeId)
        .execute();
    });

    this.debug(
      `Deleted node ${node.id} with type ${node.type} with transaction ${transaction.id}`
    );

    eventBus.publish({
      type: 'node_deleted',
      userId,
      node: mapNode(node),
    });
  }

  public async revertCreateTransaction(
    userId: string,
    transaction: LocalCreateTransaction
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const node = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', transaction.nodeId)
      .executeTakeFirst();

    if (!node) {
      return;
    }

    const transactionRow = await workspaceDatabase
      .selectFrom('transactions')
      .selectAll()
      .where('id', '=', transaction.id)
      .executeTakeFirst();

    if (!transactionRow) {
      return;
    }

    await workspaceDatabase.transaction().execute(async (tx) => {
      await tx
        .deleteFrom('nodes')
        .where('id', '=', transaction.nodeId)
        .execute();

      await tx
        .deleteFrom('transactions')
        .where('id', '=', transaction.id)
        .execute();

      await tx
        .deleteFrom('collaborations')
        .where('node_id', '=', transaction.nodeId)
        .execute();

      await tx
        .deleteFrom('interaction_events')
        .where('node_id', '=', transaction.nodeId)
        .execute();

      await tx
        .deleteFrom('interactions')
        .where('node_id', '=', transaction.nodeId)
        .execute();
    });

    eventBus.publish({
      type: 'node_deleted',
      userId,
      node: mapNode(node),
    });
  }

  public async revertUpdateTransaction(
    userId: string,
    transaction: LocalUpdateTransaction
  ) {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      const result = await this.tryRevertUpdateTransaction(userId, transaction);

      if (result) {
        return;
      }
    }
  }

  private async tryRevertUpdateTransaction(
    userId: string,
    transaction: LocalUpdateTransaction
  ): Promise<boolean> {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const node = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', transaction.nodeId)
      .executeTakeFirst();

    if (!node) {
      return true;
    }

    const transactionRow = await workspaceDatabase
      .selectFrom('transactions')
      .selectAll()
      .where('id', '=', transaction.id)
      .executeTakeFirst();

    if (!transactionRow) {
      return true;
    }

    const previousTransactions = await workspaceDatabase
      .selectFrom('transactions')
      .selectAll()
      .where('node_id', '=', transaction.nodeId)
      .orderBy('id', 'asc')
      .execute();

    const model = registry.getModel(node.type);
    if (!model) {
      return true;
    }

    const ydoc = new YDoc();

    let lastTransaction: SelectTransaction | undefined;
    for (const previousTransaction of previousTransactions) {
      if (previousTransaction.id === transaction.id) {
        continue;
      }

      if (previousTransaction.data) {
        ydoc.applyUpdate(previousTransaction.data);
      }

      lastTransaction = previousTransaction;
    }

    if (!lastTransaction) {
      return true;
    }

    const updatedNode = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const updatedNode = await trx
          .updateTable('nodes')
          .returningAll()
          .set({
            attributes: JSON.stringify(ydoc.getAttributes()),
            updated_at: lastTransaction.created_at,
            updated_by: lastTransaction.created_by,
            transaction_id: lastTransaction.id,
          })
          .where('id', '=', transaction.nodeId)
          .where('transaction_id', '=', node.transaction_id)
          .executeTakeFirst();

        if (!updatedNode) {
          return undefined;
        }

        await trx
          .deleteFrom('transactions')
          .where('id', '=', transaction.id)
          .execute();
      });

    if (updatedNode) {
      eventBus.publish({
        type: 'node_updated',
        userId,
        node: mapNode(updatedNode),
      });

      return true;
    }

    return false;
  }

  public async revertDeleteTransaction(
    userId: string,
    transaction: LocalDeleteTransaction
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const transactionRow = await workspaceDatabase
      .selectFrom('transactions')
      .selectAll()
      .where('id', '=', transaction.id)
      .executeTakeFirst();

    if (!transactionRow) {
      return;
    }

    await workspaceDatabase
      .deleteFrom('transactions')
      .where('id', '=', transaction.id)
      .execute();
  }

  async fetchWorkspace(userId: string): Promise<SelectWorkspace> {
    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    return workspace;
  }
}

export const nodeService = new NodeService();
