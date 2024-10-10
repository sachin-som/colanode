import { MessageHandler, MessageMap } from '@/operations/messages';
import { ServerChangeMessageHandler } from '@/main/handlers/messages/server-change';
import { ServerChangeResultMessageHandler } from '@/main/handlers/messages/server-change-result';
import { ServerChangeBatchMessageHandler } from '@/main/handlers/messages/server-change-batch';

type MessageHandlerMap = {
  [K in keyof MessageMap]: MessageHandler<MessageMap[K]>;
};

export const messageHandlerMap: MessageHandlerMap = {
  server_change: new ServerChangeMessageHandler(),
  server_change_result: new ServerChangeResultMessageHandler(),
  server_change_batch: new ServerChangeBatchMessageHandler(),
};
