import { Account } from '@/types/accounts';

export type Transaction = {
  id: string;
  workspaceId: string;
  accountId: string;
  type: string;
  nodeId: string;
  input: string;
  createdAt: Date;
};

export type AccountTransactions = {
  account: Account;
  transactions: Transaction[];
};
