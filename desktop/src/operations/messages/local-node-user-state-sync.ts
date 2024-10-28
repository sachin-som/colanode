export type LocalNodeUserStateSyncMessageInput = {
  type: 'local_node_user_state_sync';
  nodeId: string;
  userId: string;
  workspaceId: string;
  versionId: string;
};

declare module '@/operations/messages' {
  interface MessageMap {
    local_node_user_state_sync: LocalNodeUserStateSyncMessageInput;
  }
}
