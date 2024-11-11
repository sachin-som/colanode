export type LocalNodeSyncMessageInput = {
  type: 'local_node_sync';
  nodeId: string;
  userId: string;
  versionId: string;
  workspaceId: string;
};

declare module '@/operations/messages' {
  interface MessageMap {
    local_node_sync: LocalNodeSyncMessageInput;
  }
}
