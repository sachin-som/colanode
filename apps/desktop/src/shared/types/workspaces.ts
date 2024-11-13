import { WorkspaceRole } from '@colanode/core';

export type Workspace = {
  id: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
  versionId: string;
  accountId: string;
  role: WorkspaceRole;
  userId: string;
};

export type WorkspaceCredentials = {
  workspaceId: string;
  accountId: string;
  userId: string;
  token: string;
  serverDomain: string;
  serverAttributes: string;
};
