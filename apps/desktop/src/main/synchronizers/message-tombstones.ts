import {
  SyncMessageTombstonesInput,
  SyncMessageTombstoneData,
} from '@colanode/core';

import { BaseSynchronizer } from '@/main/synchronizers/base';
import { messageService } from '@/main/services/message-service';

export class MessageTombstoneSynchronizer extends BaseSynchronizer<SyncMessageTombstonesInput> {
  protected async process(data: SyncMessageTombstoneData): Promise<void> {
    await messageService.syncServerMessageTombstone(this.userId, data);
  }

  protected get cursorKey(): string {
    return `message_tombstones:${this.input.rootId}`;
  }
}
