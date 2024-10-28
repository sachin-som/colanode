export type ServerNodeUserStateSyncMessageInput = {
  type: 'server_node_user_state_sync';
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
    server_node_user_state_sync: ServerNodeUserStateSyncMessageInput;
  }
}
