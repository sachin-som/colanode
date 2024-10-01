import { ServerNode, ServerNodeReaction } from '@/types/nodes';

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
  synced: boolean;
};

export type WorkspaceSyncData = {
  nodes: ServerNode[];
  nodeReactions: ServerNodeReaction[];
};

export type WorkspaceAccountsInviteOutput = {
  users: ServerNode[];
};

export type WorkspaceAccountRoleUpdateOutput = {
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
