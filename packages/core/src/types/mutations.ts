import { FileType } from './files';
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
  fileType: FileType;
  parentId: string;
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

export type Mutation =
  | CreateFileMutation
  | ApplyCreateTransactionMutation
  | ApplyUpdateTransactionMutation
  | ApplyDeleteTransactionMutation;

export type MutationType = Mutation['type'];
