import {
  MessageContext,
  MessageHandler,
  MessageInput,
} from '@/shared/messages';
import { messageHandlerMap } from '@/main/handlers/messages';

class Mediator {
  public async executeMessage<T extends MessageInput>(
    context: MessageContext,
    input: T
  ): Promise<void> {
    const handler = messageHandlerMap[input.type] as MessageHandler<T>;
    await handler.handleMessage(context, input);
  }
}

export const mediator = new Mediator();
