import { NodeBlock } from '@/types/nodes';

export type TransactionType =
  | 'create_node'
  | 'create_nodes'
  | 'update_node'
  | 'delete_node'
  | 'delete_nodes';

export type Transaction = {
  id: string;
  type: TransactionType;
  workspaceId: string;
  accountId: string;
  userId: string;
  input: string;
  createdAt: Date;
};

export type CreateNodeTransactionInput = {
  id: string;
  workspaceId: string;
  parentId?: string | null;
  type: string;
  index?: string | null;
  attrs?: Record<string, any> | null;
  content?: NodeBlock[] | null;
  createdAt: Date;
  createdBy: string;
  versionId: string;
};

export type UpdateNodeTransactionInput = {
  id: string;
  parentId?: string | null;
  index?: string | null;
  attrs?: Record<string, any> | null;
  content?: NodeBlock[] | null;
  updatedAt: Date;
  updatedBy: string;
  versionId: string;
};
