export type SynapseNodeChangeMessage = {
  workspaceId: string;
  nodeId: string;
  type: 'node_create' | 'node_update' | 'node_delete';
};

export type SynapseUserNodeChangeMessage = {
  workspaceId: string;
  nodeId: string;
  userId: string;
  type: 'user_node_update';
};

export type SynapseMessage =
  | SynapseNodeChangeMessage
  | SynapseUserNodeChangeMessage;
