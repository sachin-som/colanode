export type TransactionType = 'create_node' | 'create_nodes' | 'update_node' | 'delete_node';

export type Transaction = {
  id: string;
  type: TransactionType;
  workspaceId: string;
  accountId: string;
  userId: string;
  input: string;
  createdAt: Date;
};
