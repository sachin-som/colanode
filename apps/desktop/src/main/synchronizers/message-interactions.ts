import {
  SyncMessageInteractionsInput,
  SyncMessageInteractionData,
} from '@colanode/core';

import { BaseSynchronizer } from '@/main/synchronizers/base';
import { messageService } from '@/main/services/message-service';

export class MessageInteractionSynchronizer extends BaseSynchronizer<SyncMessageInteractionsInput> {
  protected async process(data: SyncMessageInteractionData): Promise<void> {
    await messageService.syncServerMessageInteraction(this.userId, data);
  }

  protected get cursorKey(): string {
    return `message_interactions:${this.input.rootId}`;
  }
}
