import { getIdType, IdType } from '@colanode/core';
import { Kysely } from 'kysely';

import {
  SelectCollaboration,
  WorkspaceDatabaseSchema,
} from '@/main/data/workspace/schema';
import { mapWorkspace } from '@/main/utils';
import { databaseService } from '@/main/data/database-service';
import { eventBus } from '@/shared/lib/event-bus';
import {
  CollaborationCreatedEvent,
  CollaborationDeletedEvent,
  Event,
  MessageCreatedEvent,
  MessageDeletedEvent,
  MessageInteractionUpdatedEvent,
} from '@/shared/types/events';
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
  private readonly collaborations: Map<string, SelectCollaboration> = new Map();

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
            channelId: unreadMessage.parentId,
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
            chatId: unreadMessage.parentId,
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
    const collaborations = await this.workspaceDatabase
      .selectFrom('collaborations')
      .selectAll()
      .execute();

    for (const collaboration of collaborations) {
      this.collaborations.set(collaboration.entry_id, collaboration);
    }

    if (this.collaborations.size === 0) {
      return;
    }

    const unreadMessagesRows = await this.workspaceDatabase
      .selectFrom('messages as message')
      .leftJoin('message_interactions as message_interactions', (join) =>
        join
          .onRef('message.id', '=', 'message_interactions.message_id')
          .on(
            'message_interactions.collaborator_id',
            '=',
            this.workspace.userId
          )
      )
      .innerJoin('entry_interactions as entry_interactions', (join) =>
        join
          .onRef('message.entry_id', '=', 'entry_interactions.entry_id')
          .on('entry_interactions.collaborator_id', '=', this.workspace.userId)
      )
      .select(['message.id as message_id', 'message.entry_id as entry_id'])
      .where('message.created_by', '!=', this.workspace.userId)
      .where('message_interactions.seen_at', 'is', null)
      .where('entry_interactions.last_seen_at', 'is not', null)
      .whereRef('message.created_at', '>=', 'entry_interactions.first_seen_at')
      .execute();

    for (const unreadMessageRow of unreadMessagesRows) {
      this.unreadMessages.set(unreadMessageRow.message_id, {
        messageId: unreadMessageRow.message_id,
        parentId: unreadMessageRow.entry_id,
        parentIdType: getIdType(unreadMessageRow.entry_id),
      });
    }
  }

  public async handleMessageInteractionUpdated(
    event: MessageInteractionUpdatedEvent
  ): Promise<void> {
    const interaction = event.messageInteraction;
    if (
      event.userId !== this.workspace.userId ||
      interaction.collaboratorId !== this.workspace.userId
    ) {
      return;
    }

    if (interaction.seenAt) {
      const unreadMessage = this.unreadMessages.get(interaction.messageId);
      if (unreadMessage) {
        this.unreadMessages.delete(interaction.messageId);
        eventBus.publish({
          type: 'radar_data_updated',
        });
      }
      return;
    }
  }

  public async handleMessageCreated(event: MessageCreatedEvent): Promise<void> {
    const message = event.message;
    if (message.createdBy === this.workspace.userId) {
      return;
    }

    if (this.unreadMessages.has(message.id)) {
      return;
    }

    const collaboration = this.collaborations.get(message.rootId);
    if (!collaboration) {
      return;
    }

    if (collaboration.created_at > message.createdAt) {
      return;
    }

    const messageInteraction = await this.workspaceDatabase
      .selectFrom('message_interactions')
      .selectAll()
      .where('message_id', '=', message.id)
      .where('collaborator_id', '=', this.workspace.userId)
      .executeTakeFirst();

    if (messageInteraction && messageInteraction.seen_at) {
      return;
    }

    this.unreadMessages.set(message.id, {
      messageId: message.id,
      parentId: message.rootId,
      parentIdType: getIdType(message.rootId),
    });

    eventBus.publish({
      type: 'radar_data_updated',
    });
  }

  public async handleMessageDeleted(event: MessageDeletedEvent): Promise<void> {
    const message = event.message;
    if (message.createdBy === this.workspace.userId) {
      return;
    }

    if (!this.unreadMessages.has(message.id)) {
      return;
    }

    this.unreadMessages.delete(message.id);
    eventBus.publish({
      type: 'radar_data_updated',
    });
  }

  public async handleCollaborationCreated(
    event: CollaborationCreatedEvent
  ): Promise<void> {
    const collaboration = await this.workspaceDatabase
      .selectFrom('collaborations')
      .selectAll()
      .where('entry_id', '=', event.entryId)
      .executeTakeFirst();

    if (!collaboration) {
      return;
    }

    this.collaborations.set(event.entryId, collaboration);
  }

  public async handleCollaborationDeleted(
    event: CollaborationDeletedEvent
  ): Promise<void> {
    this.collaborations.delete(event.entryId);
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
    } else if (event.type === 'message_interaction_updated') {
      const radarWorkspace = this.workspaces.get(event.userId);
      if (radarWorkspace) {
        radarWorkspace.handleMessageInteractionUpdated(event);
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
    } else if (event.type === 'message_created') {
      const radarWorkspace = this.workspaces.get(event.userId);
      if (radarWorkspace) {
        radarWorkspace.handleMessageCreated(event);
      }
    } else if (event.type === 'message_deleted') {
      const radarWorkspace = this.workspaces.get(event.userId);
      if (radarWorkspace) {
        radarWorkspace.handleMessageDeleted(event);
      }
    } else if (event.type === 'collaboration_created') {
      const radarWorkspace = this.workspaces.get(event.userId);
      if (radarWorkspace) {
        radarWorkspace.handleCollaborationCreated(event);
      }
    } else if (event.type === 'collaboration_deleted') {
      const radarWorkspace = this.workspaces.get(event.userId);
      if (radarWorkspace) {
        radarWorkspace.handleCollaborationDeleted(event);
      }
    }
  }
}

export const radarService = new RadarService();
