export type LocalUserNodeSyncMessageInput = {
  type: 'local_user_node_sync';
  nodeId: string;
  userId: string;
  workspaceId: string;
  versionId: string;
};

declare module '@/operations/messages' {
  interface MessageMap {
    local_user_node_sync: LocalUserNodeSyncMessageInput;
  }
}
