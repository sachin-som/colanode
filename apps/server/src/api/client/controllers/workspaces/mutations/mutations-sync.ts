import { Request, Response } from 'express';
import {
  SyncMutationsInput,
  SyncMutationResult,
  SyncMutationStatus,
  Mutation,
  ApplyNodeTransactionMutation,
  CreateNodeReactionMutation,
  DeleteNodeReactionMutation,
  MarkNodeSeenMutation,
  MarkNodeOpenedMutation,
  DeleteNodeMutation,
} from '@colanode/core';

import { SelectUser } from '@/data/schema';
import { ResponseBuilder } from '@/lib/response-builder';
import { applyNodeTransaction, deleteNode } from '@/lib/nodes';
import { createNodeReaction, deleteNodeReaction } from '@/lib/node-reactions';
import { markNodeAsOpened, markNodeAsSeen } from '@/lib/node-interactions';

export const mutationsSyncHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input = req.body as SyncMutationsInput;

  const results: SyncMutationResult[] = [];
  for (const mutation of input.mutations) {
    try {
      const status = await handleMutation(res.locals.user, mutation);
      results.push({
        id: mutation.id,
        status: status,
      });
    } catch (error) {
      console.error('Error handling local mutation', error);
      results.push({
        id: mutation.id,
        status: 'error',
      });
    }
  }

  return ResponseBuilder.success(res, { results });
};

const handleMutation = async (
  user: SelectUser,
  mutation: Mutation
): Promise<SyncMutationStatus> => {
  if (mutation.type === 'apply_node_transaction') {
    return await handleApplyNodeTransaction(user, mutation);
  } else if (mutation.type === 'delete_node') {
    return await handleDeleteNode(user, mutation);
  } else if (mutation.type === 'create_node_reaction') {
    return await handleCreateNodeReaction(user, mutation);
  } else if (mutation.type === 'delete_node_reaction') {
    return await handleDeleteNodeReaction(user, mutation);
  } else if (mutation.type === 'mark_node_seen') {
    return await handleMarkNodeSeen(user, mutation);
  } else if (mutation.type === 'mark_node_opened') {
    return await handleMarkNodeOpened(user, mutation);
  } else {
    return 'error';
  }
};

const handleApplyNodeTransaction = async (
  user: SelectUser,
  mutation: ApplyNodeTransactionMutation
): Promise<SyncMutationStatus> => {
  const output = await applyNodeTransaction(user, {
    id: mutation.data.id,
    nodeId: mutation.data.nodeId,
    data: mutation.data.data,
    createdAt: new Date(mutation.data.createdAt),
    operation: mutation.data.operation,
  });

  if (!output) {
    return 'error';
  }

  return 'success';
};

const handleDeleteNode = async (
  user: SelectUser,
  mutation: DeleteNodeMutation
): Promise<SyncMutationStatus> => {
  const output = await deleteNode(user, {
    id: mutation.data.id,
    rootId: mutation.data.rootId,
    deletedAt: mutation.data.deletedAt,
  });

  if (!output) {
    return 'error';
  }

  return 'success';
};

const handleCreateNodeReaction = async (
  user: SelectUser,
  mutation: CreateNodeReactionMutation
): Promise<SyncMutationStatus> => {
  const output = await createNodeReaction(user, mutation);
  return output ? 'success' : 'error';
};

const handleDeleteNodeReaction = async (
  user: SelectUser,
  mutation: DeleteNodeReactionMutation
): Promise<SyncMutationStatus> => {
  const output = await deleteNodeReaction(user, mutation);
  return output ? 'success' : 'error';
};

const handleMarkNodeSeen = async (
  user: SelectUser,
  mutation: MarkNodeSeenMutation
): Promise<SyncMutationStatus> => {
  const output = await markNodeAsSeen(user, mutation);
  return output ? 'success' : 'error';
};

const handleMarkNodeOpened = async (
  user: SelectUser,
  mutation: MarkNodeOpenedMutation
): Promise<SyncMutationStatus> => {
  const output = await markNodeAsOpened(user, mutation);
  return output ? 'success' : 'error';
};
