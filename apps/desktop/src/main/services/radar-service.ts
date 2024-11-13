import { databaseService } from '@/main/data/database-service';
import { Kysely } from 'kysely';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';
import { getIdType, IdType, NodeTypes } from '@colanode/core';
import { WorkspaceReadState } from '@/shared/types/radars';
import { eventBus } from '@/shared/lib/event-bus';

class RadarService {
  private readonly workspaceStates: Record<string, WorkspaceReadState> = {};

  constructor() {
    eventBus.subscribe((event) => {
      console.log('event', event);
    });
  }

  public async init(): Promise<void> {
    const workspaceDatabases = await databaseService.getWorkspaceDatabases();
    for (const [userId, workspaceDatabase] of workspaceDatabases.entries()) {
      await this.initWorkspace(userId, workspaceDatabase);
    }
  }

  public getWorkspaceStates(): Record<string, WorkspaceReadState> {
    return this.workspaceStates;
  }

  private async initWorkspace(
    userId: string,
    workspaceDatabase: Kysely<WorkspaceDatabaseSchema>
  ): Promise<void> {
    const workspaceState: WorkspaceReadState = {
      importantCount: 0,
      hasUnseenChanges: false,
      nodeStates: {},
    };

    const nodeUnreadMessageCounts = await workspaceDatabase
      .selectFrom('user_nodes as un')
      .innerJoin('nodes as n', 'un.node_id', 'n.id')
      .where('un.user_id', '=', userId)
      .where('n.type', '=', NodeTypes.Message)
      .where('un.last_seen_version_id', 'is', null)
      .select(['n.parent_id as node_id'])
      .select((eb) => [
        eb.fn.count<number>('un.node_id').as('messages_count'),
        eb.fn.sum<number>('un.mentions_count').as('mentions_count'),
      ])
      .groupBy('n.parent_id')
      .execute();

    for (const nodeUnreadMessageCount of nodeUnreadMessageCounts) {
      const idType = getIdType(nodeUnreadMessageCount.node_id);
      const nodeId = nodeUnreadMessageCount.node_id;
      const messagesCount = nodeUnreadMessageCount.messages_count;
      const mentionsCount = nodeUnreadMessageCount.mentions_count;

      if (idType === IdType.Chat) {
        workspaceState.nodeStates[nodeId] = {
          type: 'chat',
          nodeId,
          unseenMessagesCount: messagesCount,
          mentionsCount,
        };

        if (mentionsCount > 0) {
          workspaceState.importantCount += mentionsCount;
        }

        if (messagesCount > 0) {
          workspaceState.hasUnseenChanges = true;
        }
      } else if (idType === IdType.Channel) {
        workspaceState.nodeStates[nodeId] = {
          type: 'channel',
          nodeId,
          unseenMessagesCount: messagesCount,
          mentionsCount,
        };

        if (messagesCount > 0) {
          workspaceState.importantCount += messagesCount;
        } else if (mentionsCount > 0) {
          workspaceState.importantCount += mentionsCount;
        }
      }
    }

    this.workspaceStates[userId] = workspaceState;
  }
}

export const radarService = new RadarService();
