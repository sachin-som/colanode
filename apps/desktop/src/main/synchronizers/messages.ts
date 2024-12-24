import { SyncMessagesInput, SyncMessageData } from '@colanode/core';

import { BaseSynchronizer } from '@/main/synchronizers/base';
import { messageService } from '@/main/services/message-service';

export class MessageSynchronizer extends BaseSynchronizer<SyncMessagesInput> {
  protected async process(data: SyncMessageData): Promise<void> {
    await messageService.syncServerMessage(this.userId, data);
  }

  protected get cursorKey(): string {
    return `messages:${this.input.rootId}`;
  }
}
