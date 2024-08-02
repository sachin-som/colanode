import { Account } from '@/types/accounts';

export type Transaction = {
  id: string;
  workspaceId: string;
  accountId: string;
  type: string;
  nodeId: string;
  input: any;
  createdAt: Date;
};

export type CreateNodeTransactionInput = {
  id: string;
  parentId?: string;
  type: string;
  attrs?: Record<string, any>;
  createdAt: Date;
  createdBy: string;
};

export type UpdateNodeTransactionInput = {
  id: string;
  parentId?: string;
  attrs: Record<string, any>;
  updatedAt: Date;
  updatedBy: string;
};

export type DeleteNodeTransactionInput = {
  id: string;
};

export type AccountTransactions = {
  account: Account;
  transactions: Transaction[];
};
