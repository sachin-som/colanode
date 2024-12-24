import { SyncCollaborationData, SyncCollaborationsInput } from '@colanode/core';

import { BaseSynchronizer } from '@/main/synchronizers/base';
import { collaborationService } from '@/main/services/collaboration-service';

export class CollaborationSynchronizer extends BaseSynchronizer<SyncCollaborationsInput> {
  protected async process(data: SyncCollaborationData): Promise<void> {
    await collaborationService.syncServerCollaboration(this.userId, data);
  }

  protected get cursorKey(): string {
    return `collaborations`;
  }
}
