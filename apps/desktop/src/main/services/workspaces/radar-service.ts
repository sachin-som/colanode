import { getIdType, IdType } from '@colanode/core';

import { WorkspaceService } from '@/main/services/workspaces/workspace-service';
import { SelectCollaboration } from '@/main/databases/workspace';
import {
  ChannelReadState,
  ChatReadState,
  WorkspaceRadarData,
} from '@/shared/types/radars';
import {
  CollaborationCreatedEvent,
  CollaborationDeletedEvent,
  MessageCreatedEvent,
  MessageDeletedEvent,
  MessageInteractionUpdatedEvent,
  Event,
} from '@/shared/types/events';
import { eventBus } from '@/shared/lib/event-bus';

interface UndreadMessage {
  messageId: string;
  parentId: string;
  parentIdType: IdType;
}

export class RadarService {
  private readonly workspace: WorkspaceService;
  private readonly unreadMessages: Map<string, UndreadMessage> = new Map();
  private readonly collaborations: Map<string, SelectCollaboration> = new Map();

  constructor(workspace: WorkspaceService) {
    this.workspace = workspace;
    eventBus.subscribe(this.handleEvent.bind(this));
  }

  public getData(): WorkspaceRadarData {
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
    const collaborations = await this.workspace.database
      .selectFrom('collaborations')
      .selectAll()
      .execute();

    for (const collaboration of collaborations) {
      this.collaborations.set(collaboration.entry_id, collaboration);
    }

    if (this.collaborations.size === 0) {
      return;
    }

    const unreadMessagesRows = await this.workspace.database
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
      .where('message_interactions.last_seen_at', 'is', null)
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

  private async handleEvent(event: Event) {
    if (event.type === 'message_interaction_updated') {
      await this.handleMessageInteractionUpdated(event);
    } else if (event.type === 'message_created') {
      await this.handleMessageCreated(event);
    } else if (event.type === 'message_deleted') {
      await this.handleMessageDeleted(event);
    } else if (event.type === 'collaboration_created') {
      await this.handleCollaborationCreated(event);
    } else if (event.type === 'collaboration_deleted') {
      await this.handleCollaborationDeleted(event);
    }
  }

  private async handleMessageInteractionUpdated(
    event: MessageInteractionUpdatedEvent
  ): Promise<void> {
    const interaction = event.messageInteraction;
    if (
      event.accountId !== this.workspace.accountId ||
      event.workspaceId !== this.workspace.id ||
      interaction.collaboratorId !== this.workspace.userId
    ) {
      return;
    }

    if (interaction.lastSeenAt) {
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

  private async handleMessageCreated(
    event: MessageCreatedEvent
  ): Promise<void> {
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

    const messageInteraction = await this.workspace.database
      .selectFrom('message_interactions')
      .selectAll()
      .where('message_id', '=', message.id)
      .where('collaborator_id', '=', this.workspace.userId)
      .executeTakeFirst();

    if (messageInteraction && messageInteraction.last_seen_at) {
      return;
    }

    this.unreadMessages.set(message.id, {
      messageId: message.id,
      parentId: message.parentId,
      parentIdType: getIdType(message.parentId),
    });

    eventBus.publish({
      type: 'radar_data_updated',
    });
  }

  private async handleMessageDeleted(
    event: MessageDeletedEvent
  ): Promise<void> {
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

  private async handleCollaborationCreated(
    event: CollaborationCreatedEvent
  ): Promise<void> {
    const collaboration = await this.workspace.database
      .selectFrom('collaborations')
      .selectAll()
      .where('entry_id', '=', event.entryId)
      .executeTakeFirst();

    if (!collaboration) {
      return;
    }

    this.collaborations.set(event.entryId, collaboration);
  }

  private async handleCollaborationDeleted(
    event: CollaborationDeletedEvent
  ): Promise<void> {
    this.collaborations.delete(event.entryId);
  }
}
