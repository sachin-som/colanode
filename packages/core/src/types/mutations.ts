import { FileType } from './files';
import { MessageContent, MessageType } from './messages';
import {
  LocalCreateTransaction,
  LocalDeleteTransaction,
  LocalUpdateTransaction,
} from './sync';

export type SyncMutationsInput = {
  mutations: Mutation[];
};

export type SyncMutationsOutput = {
  results: SyncMutationResult[];
};

export type SyncMutationStatus = 'success' | 'error';

export type SyncMutationResult = {
  id: string;
  status: SyncMutationStatus;
};

export type MutationBase = {
  id: string;
  createdAt: string;
};

export type CreateFileMutationData = {
  id: string;
  type: FileType;
  parentId: string;
  entryId: string;
  rootId: string;
  name: string;
  originalName: string;
  extension: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type CreateFileMutation = MutationBase & {
  type: 'create_file';
  data: CreateFileMutationData;
};

export type ApplyCreateTransactionMutation = MutationBase & {
  type: 'apply_create_transaction';
  data: LocalCreateTransaction;
};

export type ApplyUpdateTransactionMutation = MutationBase & {
  type: 'apply_update_transaction';
  data: LocalUpdateTransaction;
};

export type ApplyDeleteTransactionMutation = MutationBase & {
  type: 'apply_delete_transaction';
  data: LocalDeleteTransaction;
};

export type CreateMessageMutationData = {
  id: string;
  type: MessageType;
  entryId: string;
  parentId: string;
  content: MessageContent;
  rootId: string;
  createdAt: string;
};

export type CreateMessageMutation = MutationBase & {
  type: 'create_message';
  data: CreateMessageMutationData;
};

export type CreateMessageReactionMutationData = {
  messageId: string;
  reaction: string;
  rootId: string;
  createdAt: string;
};

export type CreateMessageReactionMutation = MutationBase & {
  type: 'create_message_reaction';
  data: CreateMessageReactionMutationData;
};

export type DeleteMessageReactionMutationData = {
  messageId: string;
  reaction: string;
  rootId: string;
  deletedAt: string;
};

export type DeleteMessageReactionMutation = MutationBase & {
  type: 'delete_message_reaction';
  data: DeleteMessageReactionMutationData;
};

export type Mutation =
  | CreateFileMutation
  | ApplyCreateTransactionMutation
  | ApplyUpdateTransactionMutation
  | ApplyDeleteTransactionMutation
  | CreateMessageMutation
  | CreateMessageReactionMutation
  | DeleteMessageReactionMutation;

export type MutationType = Mutation['type'];
