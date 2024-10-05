import { MessageHandler, MessageMap } from '@/operations/messages';
import { ServerMutationMessageHandler } from '@/main/handlers/messages/server-mutation';

type MessageHandlerMap = {
  [K in keyof MessageMap]: MessageHandler<MessageMap[K]>;
};

export const messageHandlerMap: MessageHandlerMap = {
  server_mutation: new ServerMutationMessageHandler(),
};
