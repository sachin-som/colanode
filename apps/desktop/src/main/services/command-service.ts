import { CommandInput } from '@/shared/commands';

import { CommandMap } from '@/shared/commands';
import { commandHandlerMap } from '@/main/commands';
import { CommandHandler } from '@/main/types';

class CommandService {
  public async executeCommand<T extends CommandInput>(
    input: T
  ): Promise<CommandMap[T['type']]['output']> {
    const handler = commandHandlerMap[
      input.type
    ] as unknown as CommandHandler<T>;

    if (!handler) {
      throw new Error(`No handler found for command type: ${input.type}`);
    }

    return handler.handleCommand(input);
  }
}

export const commandService = new CommandService();
