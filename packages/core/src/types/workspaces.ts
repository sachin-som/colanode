import { EntryOutput } from './entries.js';

export type WorkspaceRole =
  | 'owner'
  | 'admin'
  | 'collaborator'
  | 'guest'
  | 'none';

export enum WorkspaceStatus {
  Active = 1,
  Inactive = 2,
}

export enum UserStatus {
  Active = 1,
  Inactive = 2,
}

export type WorkspaceCreateInput = {
  name: string;
  description?: string | null;
  avatar?: string | null;
};

export type WorkspaceOutput = {
  id: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
  user: WorkspaceUserOutput;
};

export type WorkspaceUserOutput = {
  id: string;
  accountId: string;
  role: WorkspaceRole;
  storageLimit: bigint;
  maxFileSize: bigint;
};

export type WorkspaceUpdateInput = {
  name: string;
  description?: string | null;
  avatar?: string | null;
};

export type UsersInviteInput = {
  emails: string[];
  role: WorkspaceRole;
};

export type UserInviteResult = {
  email: string;
  result: 'success' | 'error' | 'exists';
};

export type UsersInviteOutput = {
  results: UserInviteResult[];
};

export type UserRoleUpdateInput = {
  role: WorkspaceRole;
};

export type UserRoleUpdateOutput = {
  user: EntryOutput;
};
