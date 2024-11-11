export enum WorkspaceStatus {
  Active = 1,
  Inactive = 2,
}

export type WorkspaceRole =
  | 'owner'
  | 'admin'
  | 'collaborator'
  | 'guest'
  | 'none';

export enum WorkspaceUserStatus {
  Active = 1,
  Inactive = 2,
}

export type WorkspaceUser = {
  id: string;
  workspaceId: string;
  accountId: string;
  role: WorkspaceRole;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string | null;
  status: WorkspaceUserStatus;
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
  user: WorkspaceUserOutput;
};

export type WorkspaceUserOutput = {
  id: string;
  accountId: string;
  role: WorkspaceRole;
};

export type WorkspaceAccountsInviteInput = {
  emails: string[];
};

export type WorkspaceAccountRoleUpdateInput = {
  role: WorkspaceRole;
};
