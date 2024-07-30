export interface Transaction {
  id: string;
  workspaceId: string;
  type: string;
}

export type CreateNodeTransaction = Transaction & {
  type: 'create_node';
  input: {
    id: string;
    parentId?: string;
    type: string;
    attrs?: Record<string, any>;
    createdAt: Date;
    createdBy: string;
  };
};

export function isCreateNodeTransaction(transaction: Transaction): transaction is CreateNodeTransaction {
  return transaction.type === 'create_node';
}

export type UpdateNodeTransaction = Transaction & {
  type: 'update_node';
  input: {
    id: string;
    parentId?: string;
    attrs: Record<string, any>;
    updatedAt: Date;
    updatedBy: string;
  };
};

export function isUpdateNodeTransaction(transaction: Transaction): transaction is UpdateNodeTransaction {
  return transaction.type === 'update_node';
}

export type DeleteNodeTransaction = Transaction & {
  type: 'delete_node';
  input: {
    id: string;
  };
};

export function isDeleteNodeTransaction(transaction: Transaction): transaction is DeleteNodeTransaction {
  return transaction.type === 'delete_node';
}