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
  MarkEntrySeenMutation,
  MarkEntryOpenedMutation,
  MarkMessageSeenMutation,
  MarkFileSeenMutation,
  MarkFileOpenedMutation,
  DeleteFileMutation,
  DeleteMessageMutation,
} from '@colanode/core';

import { SelectUser } from '@/data/schema';
import { entryService } from '@/services/entry-service';
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
  } else if (mutation.type === 'delete_file') {
    return await handleDeleteFile(user, mutation);
  } else if (mutation.type === 'create_message') {
    return await handleCreateMessage(user, mutation);
  } else if (mutation.type === 'delete_message') {
    return await handleDeleteMessage(user, mutation);
  } else if (mutation.type === 'create_message_reaction') {
    return await handleCreateMessageReaction(user, mutation);
  } else if (mutation.type === 'delete_message_reaction') {
    return await handleDeleteMessageReaction(user, mutation);
  } else if (mutation.type === 'mark_entry_seen') {
    return await handleMarkEntrySeenMutation(user, mutation);
  } else if (mutation.type === 'mark_entry_opened') {
    return await handleMarkEntryOpenedMutation(user, mutation);
  } else if (mutation.type === 'mark_message_seen') {
    return await handleMarkMessageSeenMutation(user, mutation);
  } else if (mutation.type === 'mark_file_seen') {
    return await handleMarkFileSeenMutation(user, mutation);
  } else if (mutation.type === 'mark_file_opened') {
    return await markFileOpenedMutation(user, mutation);
  } else {
    return 'error';
  }
};

const handleCreateTransaction = async (
  user: SelectUser,
  mutation: ApplyCreateTransactionMutation
): Promise<SyncMutationStatus> => {
  const output = await entryService.applyCreateTransaction(user, {
    id: mutation.data.id,
    entryId: mutation.data.entryId,
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
  const output = await entryService.applyUpdateTransaction(user, {
    id: mutation.data.id,
    entryId: mutation.data.entryId,
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
  const output = await entryService.applyDeleteTransaction(user, {
    id: mutation.data.id,
    entryId: mutation.data.entryId,
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

const handleDeleteFile = async (
  user: SelectUser,
  mutation: DeleteFileMutation
): Promise<SyncMutationStatus> => {
  const output = await fileService.deleteFile(user, mutation);
  return output ? 'success' : 'error';
};

const handleCreateMessage = async (
  user: SelectUser,
  mutation: CreateMessageMutation
): Promise<SyncMutationStatus> => {
  const output = await messageService.createMessage(user, mutation);
  return output ? 'success' : 'error';
};

const handleDeleteMessage = async (
  user: SelectUser,
  mutation: DeleteMessageMutation
): Promise<SyncMutationStatus> => {
  const output = await messageService.deleteMessage(user, mutation);
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

const handleMarkEntrySeenMutation = async (
  user: SelectUser,
  mutation: MarkEntrySeenMutation
): Promise<SyncMutationStatus> => {
  const output = await entryService.markEntryAsSeen(user, mutation);
  return output ? 'success' : 'error';
};

const handleMarkEntryOpenedMutation = async (
  user: SelectUser,
  mutation: MarkEntryOpenedMutation
): Promise<SyncMutationStatus> => {
  const output = await entryService.markEntryAsOpened(user, mutation);
  return output ? 'success' : 'error';
};

const handleMarkMessageSeenMutation = async (
  user: SelectUser,
  mutation: MarkMessageSeenMutation
): Promise<SyncMutationStatus> => {
  const output = await messageService.markMessageAsSeen(user, mutation);
  return output ? 'success' : 'error';
};

const handleMarkFileSeenMutation = async (
  user: SelectUser,
  mutation: MarkFileSeenMutation
): Promise<SyncMutationStatus> => {
  const output = await fileService.markFileAsSeen(user, mutation);
  return output ? 'success' : 'error';
};

const markFileOpenedMutation = async (
  user: SelectUser,
  mutation: MarkFileOpenedMutation
): Promise<SyncMutationStatus> => {
  const output = await fileService.markFileAsOpened(user, mutation);
  return output ? 'success' : 'error';
};
