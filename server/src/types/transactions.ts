export type Transaction = {
  id: string;
  workspaceId: string;
  accountId: string;
  type: string;
  nodeId: string;
  input: string;
  createdAt: Date;
};
