import {
  canCreateNode,
  canDeleteNode,
  canUpdateNode,
  createDebugger,
  extractNodeCollaborators,
  Node,
  NodeAttributes,
  nodeAttributesSchema,
  TransactionOperation,
} from '@colanode/core';
import { YDoc } from '@colanode/crdt';
import { cloneDeep } from 'lodash-es';

import { database } from '@/data/database';
import {
  CreateCollaboration,
  CreateNode,
  SelectNode,
  SelectUser,
} from '@/data/schema';
import {
  ApplyNodeTransactionInput,
  ApplyNodeTransactionOutput,
  CreateNodeInput,
  CreateNodeOutput,
  DeleteNodeInput,
  DeleteNodeOutput,
  UpdateNodeInput,
  UpdateNodeOutput,
} from '@/types/nodes';
import { eventBus } from '@/lib/event-bus';
import {
  applyCollaboratorUpdates,
  checkCollaboratorChanges,
} from '@/lib/collaborations';
import { jobService } from '@/services/job-service';

const debug = createDebugger('server:lib:nodes');

const UPDATE_RETRIES_LIMIT = 10;

type UpdateResult<T> = {
  type: 'success' | 'error' | 'retry';
  output: T | null;
};

export const mapNode = (node: SelectNode): Node => {
  return {
    id: node.id,
    parentId: node.parent_id,
    rootId: node.root_id,
    type: node.type,
    attributes: node.attributes,
    createdAt: node.created_at.toISOString(),
    createdBy: node.created_by,
    updatedAt: node.updated_at?.toISOString() ?? null,
    updatedBy: node.updated_by ?? null,
  } as Node;
};

export const fetchNode = async (nodeId: string): Promise<SelectNode | null> => {
  const result = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', nodeId)
    .executeTakeFirst();

  return result ?? null;
};

export const fetchNodeAncestors = async (
  nodeId: string
): Promise<SelectNode[]> => {
  const result = await database
    .selectFrom('nodes')
    .selectAll()
    .innerJoin('node_paths', 'nodes.id', 'node_paths.ancestor_id')
    .where('node_paths.descendant_id', '=', nodeId)
    .orderBy('node_paths.level', 'desc')
    .execute();

  return result;
};

export const fetchNodeDescendants = async (
  nodeId: string
): Promise<string[]> => {
  const result = await database
    .selectFrom('node_paths')
    .select('descendant_id')
    .where('ancestor_id', '=', nodeId)
    .orderBy('level', 'asc')
    .execute();

  return result.map((row) => row.descendant_id);
};

export const createNode = async (
  input: CreateNodeInput
): Promise<CreateNodeOutput | null> => {
  const ydoc = new YDoc();
  const update = ydoc.updateAttributes(nodeAttributesSchema, input.attributes);

  if (!update) {
    return null;
  }

  const attributes = ydoc.getAttributes<NodeAttributes>();
  const attributesJson = JSON.stringify(attributes);
  const state = ydoc.getState();
  const date = new Date();

  const createNode: CreateNode = {
    id: input.nodeId,
    root_id: input.rootId,
    workspace_id: input.workspaceId,
    attributes: attributesJson,
    created_at: date,
    created_by: input.userId,
    state: state,
  };

  const collaborationsToCreate: CreateCollaboration[] = Object.entries(
    extractNodeCollaborators(attributes)
  ).map(([userId, role]) => ({
    collaborator_id: userId,
    node_id: input.nodeId,
    workspace_id: input.workspaceId,
    role,
    created_at: new Date(),
    created_by: input.userId,
  }));

  try {
    const { createdNode, createdCollaborations } = await database
      .transaction()
      .execute(async (trx) => {
        const createdNode = await trx
          .insertInto('nodes')
          .returningAll()
          .values(createNode)
          .executeTakeFirst();

        if (!createdNode) {
          throw new Error('Failed to create node');
        }

        if (collaborationsToCreate.length > 0) {
          const createdCollaborations = await trx
            .insertInto('collaborations')
            .returningAll()
            .values(collaborationsToCreate)
            .execute();

          return { createdNode, createdCollaborations };
        }

        return { createdNode, createdCollaborations: [] };
      });

    eventBus.publish({
      type: 'node_created',
      nodeId: input.nodeId,
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
    };
  } catch (error) {
    debug(`Failed to create node transaction: ${error}`);
    return null;
  }
};

export const updateNode = async (
  input: UpdateNodeInput
): Promise<UpdateNodeOutput | null> => {
  for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
    const result = await tryUpdateNode(input);

    if (result.type === 'success') {
      return result.output;
    }

    if (result.type === 'error') {
      return null;
    }
  }

  return null;
};

export const tryUpdateNode = async (
  input: UpdateNodeInput
): Promise<UpdateResult<UpdateNodeOutput>> => {
  const node = await fetchNode(input.nodeId);
  if (!node) {
    return { type: 'error', output: null };
  }

  const ydoc = new YDoc(node.state);
  const currentAttributes = ydoc.getAttributes<NodeAttributes>();
  const updatedAttributes = input.updater(cloneDeep(currentAttributes));
  if (!updatedAttributes) {
    return { type: 'error', output: null };
  }

  const update = ydoc.updateAttributes(nodeAttributesSchema, updatedAttributes);

  if (!update) {
    return { type: 'success', output: null };
  }

  const attributes = ydoc.getAttributes<NodeAttributes>();
  const attributesJson = JSON.stringify(attributes);

  const date = new Date();
  const state = ydoc.getState();

  const collaboratorChanges = checkCollaboratorChanges(
    node.attributes,
    attributes
  );

  try {
    const { updatedNode, createdCollaborations, updatedCollaborations } =
      await database.transaction().execute(async (trx) => {
        const updatedNode = await trx
          .updateTable('nodes')
          .returningAll()
          .set({
            attributes: attributesJson,
            updated_at: date,
            updated_by: input.userId,
            state: state,
          })
          .where('id', '=', input.nodeId)
          .where('revision', '=', node.revision)
          .executeTakeFirst();

        if (!updatedNode) {
          throw new Error('Failed to update node');
        }

        const { createdCollaborations, updatedCollaborations } =
          await applyCollaboratorUpdates(
            trx,
            input.nodeId,
            input.userId,
            input.workspaceId,
            collaboratorChanges
          );

        return {
          updatedNode,
          createdCollaborations,
          updatedCollaborations,
        };
      });

    eventBus.publish({
      type: 'node_updated',
      nodeId: input.nodeId,
      rootId: node.root_id,
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
      },
    };
  } catch {
    return { type: 'retry', output: null };
  }
};

export const applyNodeTransaction = async (
  user: SelectUser,
  input: ApplyNodeTransactionInput
): Promise<ApplyNodeTransactionOutput | null> => {
  if (input.operation === TransactionOperation.Create) {
    return applyNodeCreateTransaction(user, input);
  }

  if (input.operation === TransactionOperation.Update) {
    return applyNodeUpdateTransaction(user, input);
  }

  return null;
};

const applyNodeCreateTransaction = async (
  user: SelectUser,
  input: ApplyNodeTransactionInput
): Promise<ApplyNodeTransactionOutput | null> => {
  const ydoc = new YDoc();
  ydoc.applyUpdate(input.data);

  const attributes = ydoc.getAttributes<NodeAttributes>();
  let root: SelectNode | null = null;

  if (attributes.type !== 'space' && attributes.type !== 'chat') {
    const parent = await fetchNode(attributes.parentId);
    if (!parent) {
      return null;
    }

    root = await fetchNode(parent.root_id);
  }

  if (
    !canCreateNode(
      {
        user: {
          userId: user.id,
          role: user.role,
        },
        root: root ? mapNode(root) : null,
      },
      attributes.type
    )
  ) {
    return null;
  }

  const createNode: CreateNode = {
    id: input.nodeId,
    root_id: root?.id ?? input.nodeId,
    attributes: JSON.stringify(attributes),
    workspace_id: user.workspace_id,
    created_at: input.createdAt,
    created_by: user.id,
    state: ydoc.getState(),
  };

  const collaborationsToCreate: CreateCollaboration[] = Object.entries(
    extractNodeCollaborators(attributes)
  ).map(([userId, role]) => ({
    collaborator_id: userId,
    node_id: input.nodeId,
    workspace_id: user.workspace_id,
    role,
    created_at: new Date(),
    created_by: user.id,
  }));

  try {
    const { createdNode, createdCollaborations } = await database
      .transaction()
      .execute(async (trx) => {
        const createdNode = await trx
          .insertInto('nodes')
          .returningAll()
          .values(createNode)
          .executeTakeFirst();

        if (!createdNode) {
          throw new Error('Failed to create node');
        }

        if (collaborationsToCreate.length > 0) {
          const createdCollaborations = await trx
            .insertInto('collaborations')
            .returningAll()
            .values(collaborationsToCreate)
            .execute();

          return { createdNode, createdCollaborations };
        }

        return { createdNode, createdCollaborations: [] };
      });

    eventBus.publish({
      type: 'node_created',
      nodeId: input.nodeId,
      rootId: root?.id ?? input.nodeId,
      workspaceId: user.workspace_id,
    });

    for (const createdCollaboration of createdCollaborations) {
      eventBus.publish({
        type: 'collaboration_created',
        collaboratorId: createdCollaboration.collaborator_id,
        nodeId: input.nodeId,
        workspaceId: user.workspace_id,
      });
    }

    return {
      node: createdNode,
    };
  } catch (error) {
    debug(`Failed to create node transaction: ${error}`);
    return null;
  }
};

const applyNodeUpdateTransaction = async (
  user: SelectUser,
  input: ApplyNodeTransactionInput
): Promise<ApplyNodeTransactionOutput | null> => {
  for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
    const result = await tryApplyNodeUpdateTransaction(user, input);

    if (result.type === 'success') {
      return result.output;
    }

    if (result.type === 'error') {
      return null;
    }
  }

  return null;
};

const tryApplyNodeUpdateTransaction = async (
  user: SelectUser,
  input: ApplyNodeTransactionInput
): Promise<UpdateResult<ApplyNodeTransactionOutput>> => {
  const node = await fetchNode(input.nodeId);
  if (!node) {
    return { type: 'error', output: null };
  }

  const root = await fetchNode(node.root_id);
  if (!root) {
    return { type: 'error', output: null };
  }

  const ydoc = new YDoc(node.state);
  ydoc.applyUpdate(input.data);

  const attributes = ydoc.getAttributes<NodeAttributes>();
  const attributesJson = JSON.stringify(attributes);

  if (
    !canUpdateNode(
      {
        user: {
          userId: user.id,
          role: user.role,
        },
        root: mapNode(root),
        node: mapNode(node),
      },
      attributes
    )
  ) {
    return { type: 'error', output: null };
  }

  const collaboratorChanges = checkCollaboratorChanges(
    node.attributes,
    attributes
  );

  try {
    const { updatedNode, createdCollaborations, updatedCollaborations } =
      await database.transaction().execute(async (trx) => {
        const updatedNode = await trx
          .updateTable('nodes')
          .returningAll()
          .set({
            attributes: attributesJson,
            updated_at: input.createdAt,
            updated_by: user.id,
            state: ydoc.getState(),
          })
          .where('id', '=', input.nodeId)
          .where('revision', '=', node.revision)
          .executeTakeFirst();

        if (!updatedNode) {
          throw new Error('Failed to update node');
        }

        const { createdCollaborations, updatedCollaborations } =
          await applyCollaboratorUpdates(
            trx,
            input.nodeId,
            user.id,
            user.workspace_id,
            collaboratorChanges
          );

        return {
          updatedNode,
          createdCollaborations,
          updatedCollaborations,
        };
      });

    eventBus.publish({
      type: 'node_updated',
      nodeId: input.nodeId,
      rootId: root.id,
      workspaceId: user.workspace_id,
    });

    for (const createdCollaboration of createdCollaborations) {
      eventBus.publish({
        type: 'collaboration_created',
        collaboratorId: createdCollaboration.collaborator_id,
        nodeId: input.nodeId,
        workspaceId: user.workspace_id,
      });
    }

    for (const updatedCollaboration of updatedCollaborations) {
      eventBus.publish({
        type: 'collaboration_updated',
        collaboratorId: updatedCollaboration.collaborator_id,
        nodeId: input.nodeId,
        workspaceId: user.workspace_id,
      });
    }

    return {
      type: 'success',
      output: {
        node: updatedNode,
      },
    };
  } catch {
    return { type: 'retry', output: null };
  }
};

export const deleteNode = async (
  user: SelectUser,
  input: DeleteNodeInput
): Promise<DeleteNodeOutput | null> => {
  const node = await fetchNode(input.id);
  if (!node) {
    return null;
  }

  const root = await fetchNode(node.root_id);
  if (!root) {
    return null;
  }

  if (
    !canDeleteNode({
      user: {
        userId: user.id,
        role: user.role,
      },
      root: mapNode(root),
      node: mapNode(node),
    })
  ) {
    return null;
  }

  const { deletedNode, updatedCollaborations } = await database
    .transaction()
    .execute(async (trx) => {
      const deletedNode = await trx
        .deleteFrom('nodes')
        .returningAll()
        .where('id', '=', input.id)
        .executeTakeFirst();

      if (!deletedNode) {
        throw new Error('Failed to delete node');
      }

      const createdTombstone = await trx
        .insertInto('node_tombstones')
        .returningAll()
        .values({
          id: node.id,
          root_id: node.root_id,
          workspace_id: node.workspace_id,
          deleted_at: new Date(input.deletedAt),
          deleted_by: user.id,
        })
        .executeTakeFirst();

      if (!createdTombstone) {
        throw new Error('Failed to create tombstone');
      }

      await trx
        .deleteFrom('node_reactions')
        .where('node_id', '=', input.id)
        .execute();

      await trx
        .deleteFrom('node_interactions')
        .where('node_id', '=', input.id)
        .execute();

      const updatedCollaborations = await trx
        .updateTable('collaborations')
        .set({
          deleted_at: new Date(),
          deleted_by: user.id,
        })
        .returningAll()
        .where('node_id', '=', input.id)
        .execute();

      return {
        deletedNode,
        updatedCollaborations,
      };
    });

  eventBus.publish({
    type: 'node_deleted',
    nodeId: input.id,
    rootId: node.root_id,
    workspaceId: user.workspace_id,
  });

  for (const updatedCollaboration of updatedCollaborations) {
    eventBus.publish({
      type: 'collaboration_updated',
      collaboratorId: updatedCollaboration.collaborator_id,
      nodeId: input.id,
      workspaceId: user.workspace_id,
    });
  }

  await jobService.addJob({
    type: 'clean_node_data',
    nodeId: input.id,
    workspaceId: user.workspace_id,
    userId: user.id,
  });

  return {
    node: deletedNode,
  };
};
