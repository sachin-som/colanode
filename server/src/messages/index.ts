import { LocalNodeSyncMessageInput } from '@/messages/local-node-sync';
import { ServerNodesSyncMessageInput } from '@/messages/server-nodes-sync';
export interface MessageMap {
  local_node_sync: LocalNodeSyncMessageInput;
  server_nodes_sync: ServerNodesSyncMessageInput;
}

export type MessageInput = MessageMap[keyof MessageMap];

export type MessageContext = {
  accountId: string;
  deviceId: string;
};
