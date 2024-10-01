export type ServerMutation = {
  id: string;
  table: string;
  action: string;
  workspaceId: string;
  before: any | null;
  after: any | null;
};

export type ServerExecuteMutationsResponse = {
  results: ServerExecuteMutationResult[];
};

export type ServerExecuteMutationResult = {
  id: number;
  status: ServerExecuteMutationStatus;
};

export type ServerExecuteMutationStatus = 'success' | 'error';
