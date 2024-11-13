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

declare module '@/shared/messages' {
  interface MessageMap {
    server_node_sync: ServerNodeSyncMessageInput;
  }
}
