export enum WorkspaceRole {
  Owner = 1,
  Admin = 2,
  Collaborator = 3,
  Viewer = 4,
}

export type Workspace = {
  id: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
  versionId: string;
  accountId: string;
  role: WorkspaceRole;
  userNodeId: string;
  syncedAt?: Date | null;
};
