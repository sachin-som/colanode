import { FileType } from './files';
import { LocalNodeTransaction } from './transactions';

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

export type ApplyNodeTransactionMutation = MutationBase & {
  type: 'apply_node_transaction';
  data: LocalNodeTransaction;
};

export type DeleteNodeMutationData = {
  id: string;
  rootId: string;
  deletedAt: string;
};

export type DeleteNodeMutation = MutationBase & {
  type: 'delete_node';
  data: DeleteNodeMutationData;
};

export type CreateNodeReactionMutationData = {
  nodeId: string;
  reaction: string;
  rootId: string;
  createdAt: string;
};

export type CreateNodeReactionMutation = MutationBase & {
  type: 'create_node_reaction';
  data: CreateNodeReactionMutationData;
};

export type DeleteNodeReactionMutationData = {
  nodeId: string;
  reaction: string;
  rootId: string;
  deletedAt: string;
};

export type DeleteNodeReactionMutation = MutationBase & {
  type: 'delete_node_reaction';
  data: DeleteNodeReactionMutationData;
};

export type MarkNodeSeenMutationData = {
  nodeId: string;
  collaboratorId: string;
  seenAt: string;
};

export type MarkNodeSeenMutation = MutationBase & {
  type: 'mark_node_seen';
  data: MarkNodeSeenMutationData;
};

export type MarkNodeOpenedMutationData = {
  nodeId: string;
  collaboratorId: string;
  openedAt: string;
};

export type MarkNodeOpenedMutation = MutationBase & {
  type: 'mark_node_opened';
  data: MarkNodeOpenedMutationData;
};

export type Mutation =
  | CreateFileMutation
  | ApplyNodeTransactionMutation
  | DeleteNodeMutation
  | CreateNodeReactionMutation
  | DeleteNodeReactionMutation
  | MarkNodeSeenMutation
  | MarkNodeOpenedMutation;

export type MutationType = Mutation['type'];
