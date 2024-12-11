import { SyncInteractionsMessage } from '@colanode/core';
import { sql } from 'kysely';

import { SelectInteractionEvent } from '@/main/data/workspace/schema';
import { socketService } from '@/main/services/socket-service';
import { fetchWorkspaceCredentials } from '@/main/utils';
import { createDebugger } from '@/main/debugger';
import { databaseService } from '@/main/data/database-service';
import { serverService } from '@/main/services/server-service';
import { JobHandler } from '@/main/jobs';

export type SyncPendingInteractionsInput = {
  type: 'sync_pending_interactions';
  userId: string;
};

declare module '@/main/jobs' {
  interface JobMap {
    sync_pending_interactions: {
      input: SyncPendingInteractionsInput;
    };
  }
}

export class SyncPendingInteractionsJobHandler
  implements JobHandler<SyncPendingInteractionsInput>
{
  public triggerDebounce = 100;
  public interval = 1000 * 60;

  private readonly debug = createDebugger('job:sync-pending-interactions');

  public async handleJob(input: SyncPendingInteractionsInput) {
    this.debug(`Sending local pending interactions for user ${input.userId}`);

    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const credentials = await fetchWorkspaceCredentials(input.userId);
    if (!credentials) {
      this.debug(
        `No workspace credentials found for user ${input.userId}, skipping sending local pending interactions`
      );
      return;
    }

    if (!serverService.isAvailable(credentials.serverDomain)) {
      this.debug(
        `Server ${credentials.serverDomain} is not available, skipping sending local pending interactions`
      );
      return;
    }

    const cutoff = new Date(Date.now() - 1000 * 60 * 5).toISOString();
    let cursor = '0';
    let hasMore = true;

    while (hasMore) {
      const interactionEvents = await workspaceDatabase
        .selectFrom('interaction_events')
        .selectAll()
        .where((eb) =>
          eb.or([eb('sent_at', 'is', null), eb('sent_at', '<', cutoff)])
        )
        .where('event_id', '>', cursor)
        .limit(50)
        .execute();

      if (interactionEvents.length === 0) {
        this.debug(
          `No local pending interactions found for user ${input.userId}, stopping sync`
        );
        hasMore = false;
        break;
      }

      this.debug(
        `Sending ${interactionEvents.length} local pending interactions for user ${input.userId}`
      );

      const groupedByNodeId: Record<string, SelectInteractionEvent[]> = {};
      for (const event of interactionEvents) {
        groupedByNodeId[event.node_id] = [
          ...(groupedByNodeId[event.node_id] ?? []),
          event,
        ];

        cursor = event.event_id;
      }

      const sentEventIds: string[] = [];
      for (const [nodeId, events] of Object.entries(groupedByNodeId)) {
        if (events.length === 0) {
          continue;
        }

        const firstEvent = events[0];
        if (!firstEvent) {
          continue;
        }

        const message: SyncInteractionsMessage = {
          type: 'sync_interactions',
          nodeId,
          nodeType: firstEvent.node_type,
          userId: credentials.userId,
          events: events.map((e) => ({
            attribute: e.attribute,
            value: e.value,
            createdAt: e.created_at,
          })),
        };

        const sent = socketService.sendMessage(credentials.accountId, message);
        if (sent) {
          sentEventIds.push(...events.map((e) => e.event_id));
        }
      }

      if (sentEventIds.length > 0) {
        this.debug(
          `Marking ${sentEventIds.length} local pending interactions as sent for user ${input.userId}`
        );

        await workspaceDatabase
          .updateTable('interaction_events')
          .set({
            sent_at: new Date().toISOString(),
            sent_count: sql`sent_count + 1`,
          })
          .where('event_id', 'in', sentEventIds)
          .execute();

        await workspaceDatabase
          .deleteFrom('interaction_events')
          .where('sent_count', '>', 20)
          .execute();
      }
    }
  }
}
