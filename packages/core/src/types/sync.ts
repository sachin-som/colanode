import { InteractionAttributes } from './interactions';

export type LocalTransaction =
  | LocalCreateTransaction
  | LocalUpdateTransaction
  | LocalDeleteTransaction;

export type LocalCreateTransaction = {
  id: string;
  nodeId: string;
  rootId: string;
  operation: 'create';
  data: string;
  createdAt: string;
  createdBy: string;
};

export type LocalUpdateTransaction = {
  id: string;
  nodeId: string;
  rootId: string;
  operation: 'update';
  data: string;
  createdAt: string;
  createdBy: string;
};

export type LocalDeleteTransaction = {
  id: string;
  nodeId: string;
  rootId: string;
  operation: 'delete';
  createdAt: string;
  createdBy: string;
};

export type ServerInteraction = {
  userId: string;
  nodeId: string;
  workspaceId: string;
  attributes: InteractionAttributes;
  createdAt: string;
  updatedAt: string | null;
  serverCreatedAt: string;
  serverUpdatedAt: string | null;
  version: string;
};
