export enum WorkspaceStatus {
  Active = 1,
  Inactive = 2,
}

export enum WorkspaceRole {
  Owner = 1,
  Admin = 2,
  Collaborator = 3,
  Viewer = 4,
}

export enum WorkspaceAccountStatus {
  Active = 1,
  Inactive = 2,
}

export type Workspace = {
  id: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string | null;
  status: WorkspaceStatus;
  versionId: string;
};

export type WorkspaceAccount = {
  workspaceId: string;
  accountId: string;
  userNodeId: string;
  role: WorkspaceRole;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string | null;
  status: WorkspaceAccountStatus;
  versionId: string;
};

export type WorkspaceInput = {
  name: string;
  description?: string | null;
  avatar?: string | null;
};

export type WorkspaceOutput = {
  id: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
  versionId: string;
  accountId: string;
  role: WorkspaceRole;
  userNodeId: string;
};
