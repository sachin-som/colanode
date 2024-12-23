import { Request, Response } from 'express';
import {
  SyncMutationsInput,
  SyncMutationResult,
  SyncMutationStatus,
  Mutation,
  ApplyCreateTransactionMutation,
  ApplyUpdateTransactionMutation,
  ApplyDeleteTransactionMutation,
  CreateFileMutation,
  CreateMessageMutation,
  CreateMessageReactionMutation,
  DeleteMessageReactionMutation,
} from '@colanode/core';

import { SelectUser } from '@/data/schema';
import { nodeService } from '@/services/node-service';
import { fileService } from '@/services/file-service';
import { messageService } from '@/services/message-service';

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

  console.log('executed mutations', results);
  res.status(200).json({ results });
};

const handleMutation = async (
  user: SelectUser,
  mutation: Mutation
): Promise<SyncMutationStatus> => {
  if (mutation.type === 'apply_create_transaction') {
    return await handleCreateTransaction(user, mutation);
  } else if (mutation.type === 'apply_update_transaction') {
    return await handleUpdateTransaction(user, mutation);
  } else if (mutation.type === 'apply_delete_transaction') {
    return await handleDeleteTransaction(user, mutation);
  } else if (mutation.type === 'create_file') {
    return await handleCreateFile(user, mutation);
  } else if (mutation.type === 'create_message') {
    return await handleCreateMessage(user, mutation);
  } else if (mutation.type === 'create_message_reaction') {
    return await handleCreateMessageReaction(user, mutation);
  } else if (mutation.type === 'delete_message_reaction') {
    return await handleDeleteMessageReaction(user, mutation);
  } else {
    return 'error';
  }
};

const handleCreateTransaction = async (
  user: SelectUser,
  mutation: ApplyCreateTransactionMutation
): Promise<SyncMutationStatus> => {
  const output = await nodeService.applyCreateTransaction(user, {
    id: mutation.data.id,
    nodeId: mutation.data.nodeId,
    rootId: mutation.data.rootId,
    data: mutation.data.data,
    createdAt: new Date(mutation.data.createdAt),
  });

  if (!output) {
    return 'error';
  }

  return 'success';
};

const handleUpdateTransaction = async (
  user: SelectUser,
  mutation: ApplyUpdateTransactionMutation
): Promise<SyncMutationStatus> => {
  const output = await nodeService.applyUpdateTransaction(user, {
    id: mutation.data.id,
    nodeId: mutation.data.nodeId,
    rootId: mutation.data.rootId,
    userId: mutation.data.createdBy,
    data: mutation.data.data,
    createdAt: new Date(mutation.data.createdAt),
  });

  if (!output) {
    return 'error';
  }

  return 'success';
};

const handleDeleteTransaction = async (
  user: SelectUser,
  mutation: ApplyDeleteTransactionMutation
): Promise<SyncMutationStatus> => {
  const output = await nodeService.applyDeleteTransaction(user, {
    id: mutation.data.id,
    nodeId: mutation.data.nodeId,
    rootId: mutation.data.rootId,
    createdAt: new Date(mutation.data.createdAt),
  });

  if (!output) {
    return 'error';
  }

  return 'success';
};

const handleCreateFile = async (
  user: SelectUser,
  mutation: CreateFileMutation
): Promise<SyncMutationStatus> => {
  const output = await fileService.createFile(user, mutation);
  return output ? 'success' : 'error';
};

const handleCreateMessage = async (
  user: SelectUser,
  mutation: CreateMessageMutation
): Promise<SyncMutationStatus> => {
  const output = await messageService.createMessage(user, mutation);
  return output ? 'success' : 'error';
};

const handleCreateMessageReaction = async (
  user: SelectUser,
  mutation: CreateMessageReactionMutation
): Promise<SyncMutationStatus> => {
  const output = await messageService.createMessageReaction(user, mutation);
  return output ? 'success' : 'error';
};

const handleDeleteMessageReaction = async (
  user: SelectUser,
  mutation: DeleteMessageReactionMutation
): Promise<SyncMutationStatus> => {
  const output = await messageService.deleteMessageReaction(user, mutation);
  return output ? 'success' : 'error';
};
