import { Node } from '@/types/nodes';

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
  userId: string;
  synced: boolean;
};

export type WorkspaceSyncData = {
  nodes: Node[];
};
