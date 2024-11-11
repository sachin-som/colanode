import { ServerNode } from '@/types/nodes';

export type WorkspaceRole =
  | 'owner'
  | 'admin'
  | 'collaborator'
  | 'guest'
  | 'none';

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
};

export type WorkspaceUsersInviteOutput = {
  users: ServerNode[];
};

export type WorkspaceUserRoleUpdateOutput = {
  user: ServerNode;
};

export type WorkspaceUserRemoveOutput = {
  user: ServerNode;
};

export type SidebarNode = {
  id: string;
  type: string;
  name: string;
  avatar: string | null;
  unreadCount: number;
  mentionsCount: number;
};

export type SidebarSpaceNode = SidebarNode & {
  children: SidebarNode[];
};

export type SidebarChatNode = {
  id: string;
  type: string;
  name: string | null;
  avatar: string | null;
  unreadCount: number;
  mentionsCount: number;
};

export type BreadcrumbNode = {
  id: string;
  type: string;
  name: string | null;
  avatar: string | null;
};

export type WorkspaceCredentials = {
  workspaceId: string;
  accountId: string;
  userId: string;
  token: string;
  serverDomain: string;
  serverAttributes: string;
};
