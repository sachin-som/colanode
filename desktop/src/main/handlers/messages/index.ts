import { MessageHandler, MessageMap } from '@/operations/messages';
import { LocalNodeSyncMessageHandler } from '@/main/handlers/messages/local-node-sync';
import { ServerNodesSyncMessageHandler } from '@/main/handlers/messages/server-nodes-sync';

type MessageHandlerMap = {
  [K in keyof MessageMap]: MessageHandler<MessageMap[K]>;
};

export const messageHandlerMap: MessageHandlerMap = {
  local_node_sync: new LocalNodeSyncMessageHandler(),
  server_nodes_sync: new ServerNodesSyncMessageHandler(),
};
