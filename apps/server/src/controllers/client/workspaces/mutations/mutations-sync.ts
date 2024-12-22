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
} from '@colanode/core';

import { SelectUser } from '@/data/schema';
import { nodeService } from '@/services/node-service';
import { fileService } from '@/services/file-service';

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
