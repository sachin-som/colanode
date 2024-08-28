export type ServerMutation = {
  id: string;
  table: string;
  action: string;
  workspaceId: string;
  before: any | null;
  after: any | null;
};
