export type LocalNodeDeleteMessageInput = {
  type: 'local_node_delete';
  nodeId: string;
  workspaceId: string;
};

declare module '@/operations/messages' {
  interface MessageMap {
    local_node_delete: LocalNodeDeleteMessageInput;
  }
}
