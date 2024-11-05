export type LocalNodeSyncMessageInput = {
  type: 'local_node_sync';
  nodeId: string;
  versionId: string;
  workspaceId: string;
};

export type LocalNodeDeleteMessageInput = {
  type: 'local_node_delete';
  nodeId: string;
  workspaceId: string;
};

export type LocalUserNodeSyncMessageInput = {
  type: 'local_user_node_sync';
  nodeId: string;
  userId: string;
  workspaceId: string;
  versionId: string;
};

export type ServerNodeSyncMessageInput = {
  type: 'server_node_sync';
  id: string;
  workspaceId: string;
  state: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  serverCreatedAt: string;
  serverUpdatedAt: string | null;
  versionId: string;
};

export type ServerUserNodeSyncMessageInput = {
  type: 'server_user_node_sync';
  userId: string;
  nodeId: string;
  workspaceId: string;
  versionId: string;
  lastSeenAt: string | null;
  lastSeenVersionId: string | null;
  mentionsCount: number;
  createdAt: string;
  updatedAt: string | null;
};

export type ServerNodeDeleteMessageInput = {
  type: 'server_node_delete';
  id: string;
  workspaceId: string;
};

export type MessageInput =
  | LocalNodeSyncMessageInput
  | LocalNodeDeleteMessageInput
  | ServerNodeSyncMessageInput
  | ServerNodeDeleteMessageInput
  | LocalUserNodeSyncMessageInput
  | ServerUserNodeSyncMessageInput;
