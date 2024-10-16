import { ServerNode } from '@/types/nodes';

export enum WorkspaceRole {
  Owner = 'owner',
  Admin = 'admin',
  Collaborator = 'collaborator',
  Viewer = 'viewer',
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
  node: ServerNode;
};

export type WorkspaceUsersInviteOutput = {
  users: ServerNode[];
};

export type WorkspaceUserRoleUpdateOutput = {
  user: ServerNode;
};

export type SidebarNode = {
  id: string;
  type: string;
  name: string | null;
  avatar: string | null;
};

export type SidebarSpaceNode = SidebarNode & {
  children: SidebarNode[];
};

export type SidebarChatNode = {
  id: string;
  type: string;
  name: string | null;
  avatar: string | null;
};

export type BreadcrumbNode = {
  id: string;
  type: string;
  name: string | null;
  avatar: string | null;
};
