import { MessageHandler, MessageMap } from '@/operations/messages';
import { LocalNodeSyncMessageHandler } from '@/main/handlers/messages/local-node-sync';
import { LocalNodeDeleteMessageHandler } from '@/main/handlers/messages/local-node-delete';
import { ServerNodeSyncMessageHandler } from '@/main/handlers/messages/server-node-sync';
import { ServerNodeDeleteMessageHandler } from '@/main/handlers/messages/server-node-delete';
import { ServerNodeUserStateSyncMessageHandler } from '@/main/handlers/messages/server-node-user-state-sync';
import { LocalNodeUserStateSyncMessageHandler } from '@/main/handlers/messages/local-node-user-state-sync';

type MessageHandlerMap = {
  [K in keyof MessageMap]: MessageHandler<MessageMap[K]>;
};

export const messageHandlerMap: MessageHandlerMap = {
  local_node_sync: new LocalNodeSyncMessageHandler(),
  local_node_delete: new LocalNodeDeleteMessageHandler(),
  server_node_sync: new ServerNodeSyncMessageHandler(),
  server_node_delete: new ServerNodeDeleteMessageHandler(),
  server_node_user_state_sync: new ServerNodeUserStateSyncMessageHandler(),
  local_node_user_state_sync: new LocalNodeUserStateSyncMessageHandler(),
};
