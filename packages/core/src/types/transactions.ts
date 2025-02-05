export enum TransactionOperation {
  Create = 1,
  Update = 2,
}

export type LocalNodeTransaction = {
  id: string;
  nodeId: string;
  operation: TransactionOperation;
  data: string;
  createdAt: string;
};
