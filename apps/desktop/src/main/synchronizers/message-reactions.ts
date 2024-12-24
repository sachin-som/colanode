import {
  SyncMessageReactionsInput,
  SyncMessageReactionData,
} from '@colanode/core';

import { BaseSynchronizer } from '@/main/synchronizers/base';
import { messageService } from '@/main/services/message-service';

export class MessageReactionSynchronizer extends BaseSynchronizer<SyncMessageReactionsInput> {
  protected async process(data: SyncMessageReactionData): Promise<void> {
    await messageService.syncServerMessageReaction(this.userId, data);
  }

  protected get cursorKey(): string {
    return `message_reactions:${this.input.rootId}`;
  }
}
