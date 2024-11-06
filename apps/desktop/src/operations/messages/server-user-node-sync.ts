export type ServerUserNodeSyncMessageInput = {
  type: 'server_user_node_sync';
  nodeId: string;
  userId: string;
  workspaceId: string;
  versionId: string;
  lastSeenAt: string | null;
  lastSeenVersionId: string | null;
  mentionsCount: number;
  createdAt: string;
  updatedAt: string | null;
};

declare module '@/operations/messages' {
  interface MessageMap {
    server_user_node_sync: ServerUserNodeSyncMessageInput;
  }
}
