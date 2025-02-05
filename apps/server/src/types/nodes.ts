import { NodeAttributes, TransactionOperation } from '@colanode/core';

import { SelectNode } from '@/data/schema';

export type NodeCollaborator = {
  nodeId: string;
  collaboratorId: string;
  role: string;
};

export type CreateNodeInput = {
  nodeId: string;
  rootId: string;
  attributes: NodeAttributes;
  userId: string;
  workspaceId: string;
};

export type CreateNodeOutput = {
  node: SelectNode;
};

export type UpdateNodeInput = {
  nodeId: string;
  userId: string;
  workspaceId: string;
  updater: (attributes: NodeAttributes) => NodeAttributes | null;
};

export type UpdateNodeOutput = {
  node: SelectNode;
};

export type ApplyNodeTransactionInput = {
  id: string;
  nodeId: string;
  operation: TransactionOperation;
  data: string | Uint8Array;
  createdAt: Date;
};

export type ApplyNodeTransactionOutput = {
  node: SelectNode;
};

export type DeleteNodeInput = {
  id: string;
  rootId: string;
  deletedAt: string;
};

export type DeleteNodeOutput = {
  node: SelectNode;
};
