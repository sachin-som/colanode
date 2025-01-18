import {
  CreateMessageReactionMutationData,
  DeleteMessageReactionMutationData,
  extractMessageText,
  SyncMessageData,
  SyncMessageInteractionData,
  SyncMessageReactionData,
  SyncMessageTombstoneData,
  createDebugger,
} from '@colanode/core';

import {
  mapMessage,
  mapMessageInteraction,
  mapMessageReaction,
} from '@/main/lib/mappers';
import { eventBus } from '@/shared/lib/event-bus';
import { WorkspaceService } from '@/main/services/workspaces/workspace-service';

export class MessageService {
  private readonly debug = createDebugger('desktop:service:message');
  private readonly workspace: WorkspaceService;

  constructor(workspace: WorkspaceService) {
    this.workspace = workspace;
  }

  public async syncServerMessage(message: SyncMessageData) {
    const existingMessage = await this.workspace.database
      .selectFrom('messages')
      .selectAll()
      .where('id', '=', message.id)
      .executeTakeFirst();

    const version = BigInt(message.version);
    if (existingMessage) {
      if (existingMessage.version === version) {
        this.debug(`Server message ${message.id} is already synced`);
        return;
      }

      const updatedMessage = await this.workspace.database
        .updateTable('messages')
        .returningAll()
        .set({
          attributes: JSON.stringify(message.attributes),
          updated_at: message.updatedAt,
          updated_by: message.updatedBy,
          root_id: message.rootId,
          version,
        })
        .where('id', '=', message.id)
        .executeTakeFirst();

      if (!updatedMessage) {
        return;
      }

      await this.workspace.database
        .deleteFrom('texts')
        .where('id', '=', message.id)
        .execute();

      const text = extractMessageText(message.id, message.attributes);
      if (text) {
        await this.workspace.database
          .insertInto('texts')
          .values({
            id: message.id,
            name: null,
            text: text.text,
          })
          .execute();
      }

      eventBus.publish({
        type: 'message_updated',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        message: mapMessage(updatedMessage),
      });

      this.debug(`Server message ${message.id} has been synced`);
      return;
    }

    const createdMessage = await this.workspace.database
      .insertInto('messages')
      .returningAll()
      .values({
        id: message.id,
        version,
        parent_id: message.entryId,
        entry_id: message.entryId,
        root_id: message.rootId,
        attributes: JSON.stringify(message.attributes),
        created_at: message.createdAt,
        created_by: message.createdBy,
        updated_at: message.updatedAt,
        updated_by: message.updatedBy,
      })
      .executeTakeFirst();

    if (!createdMessage) {
      return;
    }

    const text = extractMessageText(message.id, message.attributes);
    if (text) {
      await this.workspace.database
        .insertInto('texts')
        .values({
          id: message.id,
          name: null,
          text: text.text,
        })
        .execute();
    }

    eventBus.publish({
      type: 'message_created',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      message: mapMessage(createdMessage),
    });

    this.debug(`Server message ${message.id} has been synced`);
  }

  public async syncServerMessageTombstone(
    messageTombstone: SyncMessageTombstoneData
  ) {
    const deletedMessage = await this.workspace.database
      .deleteFrom('messages')
      .returningAll()
      .where('id', '=', messageTombstone.id)
      .executeTakeFirst();

    await this.workspace.database
      .deleteFrom('message_reactions')
      .where('message_id', '=', messageTombstone.id)
      .execute();

    await this.workspace.database
      .deleteFrom('message_interactions')
      .where('message_id', '=', messageTombstone.id)
      .execute();

    await this.workspace.database
      .deleteFrom('texts')
      .where('id', '=', messageTombstone.id)
      .execute();

    if (deletedMessage) {
      eventBus.publish({
        type: 'message_deleted',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        message: mapMessage(deletedMessage),
      });
    }

    this.debug(
      `Server message tombstone ${messageTombstone.id} has been synced`
    );
  }

  public async syncServerMessageReaction(
    messageReaction: SyncMessageReactionData
  ) {
    if (messageReaction.deletedAt) {
      const deletedMessageReaction = await this.workspace.database
        .deleteFrom('message_reactions')
        .returningAll()
        .where('message_id', '=', messageReaction.messageId)
        .where('collaborator_id', '=', messageReaction.collaboratorId)
        .where('reaction', '=', messageReaction.reaction)
        .executeTakeFirst();

      if (deletedMessageReaction) {
        eventBus.publish({
          type: 'message_reaction_deleted',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          messageReaction: mapMessageReaction(deletedMessageReaction),
        });
      }

      this.debug(
        `Server message reaction for message ${messageReaction.messageId} has been synced`
      );
      return;
    }

    const existingMessageReaction = await this.workspace.database
      .selectFrom('message_reactions')
      .selectAll()
      .where('message_id', '=', messageReaction.messageId)
      .where('collaborator_id', '=', messageReaction.collaboratorId)
      .where('reaction', '=', messageReaction.reaction)
      .executeTakeFirst();

    const version = BigInt(messageReaction.version);
    if (existingMessageReaction) {
      if (existingMessageReaction.version === version) {
        this.debug(
          `Server message reaction for message ${messageReaction.messageId} is already synced`
        );
        return;
      }

      const updatedMessageReaction = await this.workspace.database
        .updateTable('message_reactions')
        .returningAll()
        .set({
          version,
        })
        .where('message_id', '=', messageReaction.messageId)
        .where('collaborator_id', '=', messageReaction.collaboratorId)
        .where('reaction', '=', messageReaction.reaction)
        .executeTakeFirst();

      if (!updatedMessageReaction) {
        return;
      }

      this.debug(
        `Server message reaction for message ${messageReaction.messageId} has been synced`
      );
      return;
    }

    const createdMessageReaction = await this.workspace.database
      .insertInto('message_reactions')
      .returningAll()
      .values({
        message_id: messageReaction.messageId,
        collaborator_id: messageReaction.collaboratorId,
        reaction: messageReaction.reaction,
        root_id: messageReaction.rootId,
        created_at: messageReaction.createdAt,
        version,
      })
      .onConflict((b) =>
        b.columns(['message_id', 'collaborator_id', 'reaction']).doUpdateSet({
          version,
          deleted_at: null,
        })
      )
      .executeTakeFirst();

    if (!createdMessageReaction) {
      return;
    }

    eventBus.publish({
      type: 'message_reaction_created',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      messageReaction: mapMessageReaction(createdMessageReaction),
    });

    this.debug(
      `Server message reaction for message ${messageReaction.messageId} has been synced`
    );
  }

  public async syncServerMessageInteraction(
    messageInteraction: SyncMessageInteractionData
  ) {
    const existingMessageInteraction = await this.workspace.database
      .selectFrom('message_interactions')
      .selectAll()
      .where('message_id', '=', messageInteraction.messageId)
      .executeTakeFirst();

    const version = BigInt(messageInteraction.version);
    if (existingMessageInteraction) {
      if (existingMessageInteraction.version === version) {
        this.debug(
          `Server message interaction for message ${messageInteraction.messageId} is already synced`
        );
        return;
      }
    }

    const createdMessageInteraction = await this.workspace.database
      .insertInto('message_interactions')
      .returningAll()
      .values({
        message_id: messageInteraction.messageId,
        collaborator_id: messageInteraction.collaboratorId,
        root_id: messageInteraction.rootId,
        first_seen_at: messageInteraction.firstSeenAt,
        last_seen_at: messageInteraction.lastSeenAt,
        first_opened_at: messageInteraction.firstOpenedAt,
        last_opened_at: messageInteraction.lastOpenedAt,
        version,
      })
      .onConflict((b) =>
        b.columns(['message_id', 'collaborator_id']).doUpdateSet({
          first_seen_at: messageInteraction.firstSeenAt,
          last_seen_at: messageInteraction.lastSeenAt,
          first_opened_at: messageInteraction.firstOpenedAt,
          last_opened_at: messageInteraction.lastOpenedAt,
          version,
        })
      )
      .executeTakeFirst();

    if (!createdMessageInteraction) {
      return;
    }

    eventBus.publish({
      type: 'message_interaction_updated',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      messageInteraction: mapMessageInteraction(createdMessageInteraction),
    });

    this.debug(
      `Server message interaction for message ${messageInteraction.messageId} has been synced`
    );
  }

  public async revertMessageCreation(messageId: string) {
    const deletedMessage = await this.workspace.database
      .deleteFrom('messages')
      .returningAll()
      .where('id', '=', messageId)
      .executeTakeFirst();

    if (!deletedMessage) {
      return;
    }

    await this.workspace.database
      .deleteFrom('message_reactions')
      .where('message_id', '=', messageId)
      .execute();

    await this.workspace.database
      .deleteFrom('message_interactions')
      .where('message_id', '=', messageId)
      .execute();

    eventBus.publish({
      type: 'message_deleted',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      message: mapMessage(deletedMessage),
    });

    const files = await this.workspace.database
      .selectFrom('files')
      .selectAll()
      .where('parent_id', '=', messageId)
      .execute();

    for (const file of files) {
      await this.workspace.files.revertFileCreation(file.id);
    }
  }

  public async revertMessageDeletion(messageId: string) {
    const deletedMessage = await this.workspace.database
      .updateTable('messages')
      .returningAll()
      .set({
        deleted_at: null,
      })
      .where('id', '=', messageId)
      .executeTakeFirst();

    if (!deletedMessage) {
      return;
    }

    eventBus.publish({
      type: 'message_created',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      message: mapMessage(deletedMessage),
    });
  }

  public async revertMessageReactionCreation(
    messageReaction: CreateMessageReactionMutationData
  ) {
    const deletedMessageReaction = await this.workspace.database
      .deleteFrom('message_reactions')
      .returningAll()
      .where('message_id', '=', messageReaction.messageId)
      .where('collaborator_id', '=', this.workspace.userId)
      .where('reaction', '=', messageReaction.reaction)
      .executeTakeFirst();

    if (!deletedMessageReaction) {
      return;
    }

    eventBus.publish({
      type: 'message_reaction_deleted',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      messageReaction: mapMessageReaction(deletedMessageReaction),
    });
  }

  public async revertMessageReactionDeletion(
    messageReaction: DeleteMessageReactionMutationData
  ) {
    const createdMessageReaction = await this.workspace.database
      .updateTable('message_reactions')
      .returningAll()
      .set({
        deleted_at: null,
      })
      .where('message_id', '=', messageReaction.messageId)
      .where('collaborator_id', '=', this.workspace.userId)
      .where('reaction', '=', messageReaction.reaction)
      .executeTakeFirst();

    if (!createdMessageReaction) {
      return;
    }

    eventBus.publish({
      type: 'message_reaction_created',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      messageReaction: mapMessageReaction(createdMessageReaction),
    });
  }
}
