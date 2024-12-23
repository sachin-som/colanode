import {
  compareDate,
  getIdType,
  IdType,
  InteractionAttributes,
} from '@colanode/core';
import { Kysely, sql } from 'kysely';

import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';
import { mapWorkspace } from '@/main/utils';
import { databaseService } from '@/main/data/database-service';
import { eventBus } from '@/shared/lib/event-bus';
import { Event, InteractionUpdatedEvent } from '@/shared/types/events';
import {
  WorkspaceRadarData,
  ChannelReadState,
  ChatReadState,
} from '@/shared/types/radars';
import { Workspace } from '@/shared/types/workspaces';

interface UndreadMessage {
  messageId: string;
  parentId: string;
  parentIdType: IdType;
}

class RadarWorkspace {
  public readonly workspace: Workspace;
  private readonly workspaceDatabase: Kysely<WorkspaceDatabaseSchema>;
  private readonly unreadMessages: Map<string, UndreadMessage> = new Map();

  constructor(
    workspace: Workspace,
    workspaceDatabase: Kysely<WorkspaceDatabaseSchema>
  ) {
    this.workspace = workspace;
    this.workspaceDatabase = workspaceDatabase;
  }

  public getWorkspaceData(): WorkspaceRadarData {
    const data: WorkspaceRadarData = {
      accountId: this.workspace.accountId,
      userId: this.workspace.userId,
      workspaceId: this.workspace.id,
      importantCount: 0,
      hasUnseenChanges: false,
      nodeStates: {},
    };

    for (const unreadMessage of this.unreadMessages.values()) {
      if (unreadMessage.parentIdType === IdType.Channel) {
        let nodeState = data.nodeStates[
          unreadMessage.parentId
        ] as ChannelReadState;
        if (!nodeState) {
          nodeState = {
            type: 'channel',
            nodeId: unreadMessage.parentId,
            unseenMessagesCount: 0,
            mentionsCount: 0,
          };
          data.nodeStates[unreadMessage.parentId] = nodeState;
          data.hasUnseenChanges = true;
        }

        nodeState.unseenMessagesCount++;
      } else if (unreadMessage.parentIdType === IdType.Chat) {
        let nodeState = data.nodeStates[
          unreadMessage.parentId
        ] as ChatReadState;
        if (!nodeState) {
          nodeState = {
            type: 'chat',
            nodeId: unreadMessage.parentId,
            unseenMessagesCount: 0,
            mentionsCount: 0,
          };
          data.nodeStates[unreadMessage.parentId] = nodeState;
        }

        nodeState.unseenMessagesCount++;
        data.importantCount++;
      }
    }

    return data;
  }

  public async init(): Promise<void> {
    const unreadMessagesRows = await this.workspaceDatabase
      .selectFrom('nodes as node')
      .innerJoin('interactions as node_interactions', (join) =>
        join
          .onRef('node.id', '=', 'node_interactions.node_id')
          .on('node_interactions.user_id', '=', this.workspace.userId)
      )
      .innerJoin('interactions as parent_interactions', (join) =>
        join
          .onRef('node.parent_id', '=', 'parent_interactions.node_id')
          .on('parent_interactions.user_id', '=', this.workspace.userId)
      )
      .select(['node.id as node_id', 'node.parent_id as parent_id'])
      .where('node.created_by', '!=', this.workspace.userId)
      .where('node_interactions.last_seen_at', 'is', null)
      .where('parent_interactions.last_seen_at', 'is not', null)
      .whereRef(
        'node.created_at',
        '>=',
        sql`json_extract(parent_interactions.attributes, '$.firstSeenAt')`
      )
      .execute();

    for (const unreadMessageRow of unreadMessagesRows) {
      this.unreadMessages.set(unreadMessageRow.node_id, {
        messageId: unreadMessageRow.node_id,
        parentId: unreadMessageRow.parent_id,
        parentIdType: getIdType(unreadMessageRow.parent_id),
      });
    }
  }

  public async handleInteractionUpdated(
    event: InteractionUpdatedEvent
  ): Promise<void> {
    const interaction = event.interaction;
    if (
      event.userId !== this.workspace.userId ||
      interaction.userId !== this.workspace.userId
    ) {
      return;
    }

    if (interaction.attributes.lastSeenAt) {
      const unreadMessage = this.unreadMessages.get(interaction.nodeId);
      if (unreadMessage) {
        this.unreadMessages.delete(interaction.nodeId);

        eventBus.publish({
          type: 'radar_data_updated',
        });
      }

      return;
    }

    if (this.unreadMessages.has(interaction.nodeId)) {
      return;
    }

    const node = await this.workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', interaction.nodeId)
      .executeTakeFirst();

    if (!node) {
      return;
    }

    const parentInteraction = await this.workspaceDatabase
      .selectFrom('interactions')
      .selectAll()
      .where('node_id', '=', node.parent_id)
      .executeTakeFirst();

    if (!parentInteraction || !parentInteraction.last_seen_at) {
      return;
    }

    const parentInteractionAttributes: InteractionAttributes = JSON.parse(
      parentInteraction.attributes
    );

    if (
      !parentInteractionAttributes.firstSeenAt ||
      compareDate(parentInteractionAttributes.firstSeenAt, node.created_at) > 0
    ) {
      return;
    }

    this.unreadMessages.set(interaction.nodeId, {
      messageId: interaction.nodeId,
      parentId: node.parent_id,
      parentIdType: getIdType(node.parent_id),
    });

    eventBus.publish({
      type: 'radar_data_updated',
    });
  }
}

class RadarService {
  private readonly workspaces: Map<string, RadarWorkspace> = new Map();

  constructor() {
    eventBus.subscribe(this.handleEvent.bind(this));
  }

  public async init(): Promise<void> {
    const workspaces = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .execute();

    for (const workspace of workspaces) {
      const workspaceDatabase = await databaseService.getWorkspaceDatabase(
        workspace.user_id
      );

      const radarWorkspace = new RadarWorkspace(
        mapWorkspace(workspace),
        workspaceDatabase
      );
      this.workspaces.set(workspace.user_id, radarWorkspace);
      await radarWorkspace.init();
    }

    eventBus.publish({
      type: 'radar_data_updated',
    });
  }

  public getData(): Record<string, WorkspaceRadarData> {
    const data: Record<string, WorkspaceRadarData> = {};
    for (const radarWorkspace of this.workspaces.values()) {
      data[radarWorkspace.workspace.userId] = radarWorkspace.getWorkspaceData();
    }
    return data;
  }

  private async handleEvent(event: Event) {
    if (event.type === 'workspace_deleted') {
      this.workspaces.delete(event.workspace.userId);
      eventBus.publish({
        type: 'radar_data_updated',
      });
    } else if (event.type === 'interaction_updated') {
      const radarWorkspace = this.workspaces.get(event.userId);
      if (radarWorkspace) {
        radarWorkspace.handleInteractionUpdated(event);
      }
    } else if (event.type === 'workspace_created') {
      const workspaceDatabase = await databaseService.getWorkspaceDatabase(
        event.workspace.userId
      );

      const radarWorkspace = new RadarWorkspace(
        event.workspace,
        workspaceDatabase
      );
      this.workspaces.set(event.workspace.userId, radarWorkspace);
      await radarWorkspace.init();
    }
  }
}

export const radarService = new RadarService();
