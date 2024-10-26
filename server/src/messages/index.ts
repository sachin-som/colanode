import { LocalNodeSyncMessageInput } from '@/messages/local-node-sync';
import { LocalNodeDeleteMessageInput } from '@/messages/local-node-delete';
import { ServerNodeSyncMessageInput } from '@/messages/server-node-sync';
import { ServerNodeDeleteMessageInput } from '@/messages/server-node-delete';

export interface MessageMap {
  local_node_sync: LocalNodeSyncMessageInput;
  local_node_delete: LocalNodeDeleteMessageInput;
  server_node_sync: ServerNodeSyncMessageInput;
  server_node_delete: ServerNodeDeleteMessageInput;
}

export type MessageInput = MessageMap[keyof MessageMap];

export type MessageContext = {
  accountId: string;
  deviceId: string;
};
