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

import { fileService } from '@/main/services/file-service';
import {
  mapMessage,
  mapMessageInteraction,
  mapMessageReaction,
} from '@/main/utils';
import { databaseService } from '@/main/data/database-service';
import { eventBus } from '@/shared/lib/event-bus';

class MessageService {
  private readonly debug = createDebugger('desktop:service:message');

  public async syncServerMessage(userId: string, message: SyncMessageData) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const existingMessage = await workspaceDatabase
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

      const updatedMessage = await workspaceDatabase
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

      await workspaceDatabase
        .deleteFrom('texts')
        .where('id', '=', message.id)
        .execute();

      const text = extractMessageText(message.id, message.attributes);
      if (text) {
        await workspaceDatabase
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
        userId,
        message: mapMessage(updatedMessage),
      });

      this.debug(`Server message ${message.id} has been synced`);
      return;
    }

    const createdMessage = await workspaceDatabase
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
      await workspaceDatabase
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
      userId,
      message: mapMessage(createdMessage),
    });

    this.debug(`Server message ${message.id} has been synced`);
  }

  public async syncServerMessageTombstone(
    userId: string,
    messageTombstone: SyncMessageTombstoneData
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const deletedMessage = await workspaceDatabase
      .deleteFrom('messages')
      .returningAll()
      .where('id', '=', messageTombstone.id)
      .executeTakeFirst();

    await workspaceDatabase
      .deleteFrom('message_reactions')
      .where('message_id', '=', messageTombstone.id)
      .execute();

    await workspaceDatabase
      .deleteFrom('message_interactions')
      .where('message_id', '=', messageTombstone.id)
      .execute();

    await workspaceDatabase
      .deleteFrom('texts')
      .where('id', '=', messageTombstone.id)
      .execute();

    if (deletedMessage) {
      eventBus.publish({
        type: 'message_deleted',
        userId,
        message: mapMessage(deletedMessage),
      });
    }

    this.debug(
      `Server message tombstone ${messageTombstone.id} has been synced`
    );
  }

  public async syncServerMessageReaction(
    userId: string,
    messageReaction: SyncMessageReactionData
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    if (messageReaction.deletedAt) {
      const deletedMessageReaction = await workspaceDatabase
        .deleteFrom('message_reactions')
        .returningAll()
        .where('message_id', '=', messageReaction.messageId)
        .where('collaborator_id', '=', messageReaction.collaboratorId)
        .where('reaction', '=', messageReaction.reaction)
        .executeTakeFirst();

      if (deletedMessageReaction) {
        eventBus.publish({
          type: 'message_reaction_deleted',
          userId,
          messageReaction: mapMessageReaction(deletedMessageReaction),
        });
      }

      this.debug(
        `Server message reaction for message ${messageReaction.messageId} has been synced`
      );
      return;
    }

    const existingMessageReaction = await workspaceDatabase
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

      const updatedMessageReaction = await workspaceDatabase
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

    const createdMessageReaction = await workspaceDatabase
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
      userId,
      messageReaction: mapMessageReaction(createdMessageReaction),
    });

    this.debug(
      `Server message reaction for message ${messageReaction.messageId} has been synced`
    );
  }

  public async syncServerMessageInteraction(
    userId: string,
    messageInteraction: SyncMessageInteractionData
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const existingMessageInteraction = await workspaceDatabase
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

    const createdMessageInteraction = await workspaceDatabase
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
      userId,
      messageInteraction: mapMessageInteraction(createdMessageInteraction),
    });

    this.debug(
      `Server message interaction for message ${messageInteraction.messageId} has been synced`
    );
  }

  public async revertMessageCreation(userId: string, messageId: string) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const deletedMessage = await workspaceDatabase
      .deleteFrom('messages')
      .returningAll()
      .where('id', '=', messageId)
      .executeTakeFirst();

    if (!deletedMessage) {
      return;
    }

    await workspaceDatabase
      .deleteFrom('message_reactions')
      .where('message_id', '=', messageId)
      .execute();

    await workspaceDatabase
      .deleteFrom('message_interactions')
      .where('message_id', '=', messageId)
      .execute();

    eventBus.publish({
      type: 'message_deleted',
      userId,
      message: mapMessage(deletedMessage),
    });

    const files = await workspaceDatabase
      .selectFrom('files')
      .selectAll()
      .where('parent_id', '=', messageId)
      .execute();

    for (const file of files) {
      await fileService.revertFileCreation(userId, file.id);
    }
  }

  public async revertMessageDeletion(userId: string, messageId: string) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const deletedMessage = await workspaceDatabase
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
      userId,
      message: mapMessage(deletedMessage),
    });
  }

  public async revertMessageReactionCreation(
    userId: string,
    messageReaction: CreateMessageReactionMutationData
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const deletedMessageReaction = await workspaceDatabase
      .deleteFrom('message_reactions')
      .returningAll()
      .where('message_id', '=', messageReaction.messageId)
      .where('collaborator_id', '=', userId)
      .where('reaction', '=', messageReaction.reaction)
      .executeTakeFirst();

    if (!deletedMessageReaction) {
      return;
    }

    eventBus.publish({
      type: 'message_reaction_deleted',
      userId,
      messageReaction: mapMessageReaction(deletedMessageReaction),
    });
  }

  public async revertMessageReactionDeletion(
    userId: string,
    messageReaction: DeleteMessageReactionMutationData
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const createdMessageReaction = await workspaceDatabase
      .updateTable('message_reactions')
      .returningAll()
      .set({
        deleted_at: null,
      })
      .where('message_id', '=', messageReaction.messageId)
      .where('collaborator_id', '=', userId)
      .where('reaction', '=', messageReaction.reaction)
      .executeTakeFirst();

    if (!createdMessageReaction) {
      return;
    }

    eventBus.publish({
      type: 'message_reaction_created',
      userId,
      messageReaction: mapMessageReaction(createdMessageReaction),
    });
  }
}

export const messageService = new MessageService();
