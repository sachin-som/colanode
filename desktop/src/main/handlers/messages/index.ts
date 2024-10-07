import { MessageHandler, MessageMap } from '@/operations/messages';
import { ServerChangeMessageHandler } from '@/main/handlers/messages/server-change';
import { ServerChangeAckMessageHandler } from '@/main/handlers/messages/server-change-ack';

type MessageHandlerMap = {
  [K in keyof MessageMap]: MessageHandler<MessageMap[K]>;
};

export const messageHandlerMap: MessageHandlerMap = {
  server_change: new ServerChangeMessageHandler(),
  server_change_ack: new ServerChangeAckMessageHandler(),
};
