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
  NodeCreatedEvent,
  NodeDeletedEvent,
  NodeInteractionUpdatedEvent,
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
  private readonly eventSubscriptionId: string;

  constructor(workspace: WorkspaceService) {
    this.workspace = workspace;
    this.eventSubscriptionId = eventBus.subscribe(this.handleEvent.bind(this));
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
      this.collaborations.set(collaboration.node_id, collaboration);
    }

    if (this.collaborations.size === 0) {
      return;
    }

    const unreadMessagesRows = await this.workspace.database
      .selectFrom('nodes as node')
      .leftJoin('node_interactions as node_interactions', (join) =>
        join
          .onRef('node.id', '=', 'node_interactions.node_id')
          .on('node_interactions.collaborator_id', '=', this.workspace.userId)
      )
      .innerJoin('node_interactions as parent_interactions', (join) =>
        join
          .onRef('node.parent_id', '=', 'parent_interactions.node_id')
          .on('parent_interactions.collaborator_id', '=', this.workspace.userId)
      )
      .select(['node.id as node_id', 'node.parent_id as parent_id'])
      .where('node.created_by', '!=', this.workspace.userId)
      .where('node_interactions.last_seen_at', 'is', null)
      .where('parent_interactions.last_seen_at', 'is not', null)
      .whereRef('node.created_at', '>=', 'parent_interactions.first_seen_at')
      .execute();

    for (const unreadMessageRow of unreadMessagesRows) {
      if (!unreadMessageRow.parent_id) {
        continue;
      }

      this.unreadMessages.set(unreadMessageRow.node_id, {
        messageId: unreadMessageRow.node_id,
        parentId: unreadMessageRow.parent_id,
        parentIdType: getIdType(unreadMessageRow.parent_id),
      });
    }
  }

  public destroy(): void {
    eventBus.unsubscribe(this.eventSubscriptionId);
  }

  private async handleEvent(event: Event) {
    if (event.type === 'node_interaction_updated') {
      await this.handleNodeInteractionUpdated(event);
    } else if (event.type === 'node_created') {
      await this.handleNodeCreated(event);
    } else if (event.type === 'node_deleted') {
      await this.handleNodeDeleted(event);
    } else if (event.type === 'collaboration_created') {
      await this.handleCollaborationCreated(event);
    } else if (event.type === 'collaboration_deleted') {
      await this.handleCollaborationDeleted(event);
    }
  }

  private async handleNodeInteractionUpdated(
    event: NodeInteractionUpdatedEvent
  ): Promise<void> {
    const interaction = event.nodeInteraction;
    if (
      event.accountId !== this.workspace.accountId ||
      event.workspaceId !== this.workspace.id ||
      interaction.collaboratorId !== this.workspace.userId
    ) {
      return;
    }

    if (interaction.lastSeenAt) {
      const unreadMessage = this.unreadMessages.get(interaction.nodeId);
      if (unreadMessage) {
        this.unreadMessages.delete(interaction.nodeId);
        eventBus.publish({
          type: 'radar_data_updated',
        });
      }
      return;
    }
  }

  private async handleNodeCreated(event: NodeCreatedEvent): Promise<void> {
    if (event.node.type !== 'message') {
      return;
    }

    const message = event.node;
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
      .selectFrom('node_interactions')
      .selectAll()
      .where('node_id', '=', message.id)
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

  private async handleNodeDeleted(event: NodeDeletedEvent): Promise<void> {
    const message = event.node;
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
      .where('node_id', '=', event.nodeId)
      .executeTakeFirst();

    if (!collaboration) {
      return;
    }

    this.collaborations.set(event.nodeId, collaboration);
  }

  private async handleCollaborationDeleted(
    event: CollaborationDeletedEvent
  ): Promise<void> {
    this.collaborations.delete(event.nodeId);
  }
}
