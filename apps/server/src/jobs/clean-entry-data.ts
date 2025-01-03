import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { generateId, IdType } from '@colanode/core';

import { database } from '@/data/database';
import {
  CreateEntryTransaction,
  CreateFileTombstone,
  CreateMessageTombstone,
} from '@/data/schema';
import { JobHandler } from '@/types/jobs';
import { eventBus } from '@/lib/event-bus';
import { createLogger } from '@/lib/logger';
import { BUCKET_NAMES, filesStorage } from '@/data/storage';

const BATCH_SIZE = 100;

const logger = createLogger('clean-entry-data');

export type CleanEntryDataInput = {
  type: 'clean_entry_data';
  entryId: string;
  workspaceId: string;
};

declare module '@/types/jobs' {
  interface JobMap {
    clean_entry_data: {
      input: CleanEntryDataInput;
    };
  }
}

export const cleanEntryDataHandler: JobHandler<CleanEntryDataInput> = async (
  input
) => {
  logger.trace(`Cleaning entry data for ${input.entryId}`);

  const deleteTransactions = await database
    .selectFrom('entry_transactions')
    .selectAll()
    .where('entry_id', '=', input.entryId)
    .execute();

  if (deleteTransactions.length !== 1) {
    logger.error(`Expected 1 delete transaction for ${input.entryId}`);
    return;
  }

  const deleteTransaction = deleteTransactions[0];
  if (
    !deleteTransaction?.operation ||
    deleteTransaction.operation !== 'delete'
  ) {
    logger.error(`Expected delete transaction for ${input.entryId}`);
    return;
  }

  const userId = deleteTransaction.created_by;

  const parentIds = [input.entryId];
  while (parentIds.length > 0) {
    const tempParentIds = parentIds.splice(0, BATCH_SIZE);
    const deletedEntryIds = await deleteChildren(tempParentIds, userId);

    await deleteMessages(tempParentIds, userId);
    await deleteFiles(tempParentIds, userId);

    parentIds.push(...deletedEntryIds);
  }
};

const deleteChildren = async (parentIds: string[], userId: string) => {
  const deletedEntryIds: string[] = [];
  let hasMore = true;
  while (hasMore) {
    try {
      const descendants = await database
        .selectFrom('entries')
        .selectAll()
        .where('parent_id', 'in', parentIds)
        .orderBy('id', 'asc')
        .limit(BATCH_SIZE)
        .execute();

      if (descendants.length === 0) {
        logger.trace(`No descendants found for ${parentIds}`);
        hasMore = false;
        break;
      }

      const entryIds: string[] = descendants.map((d) => d.id);
      const transactionsToCreate: CreateEntryTransaction[] = descendants.map(
        (descendant) => ({
          id: generateId(IdType.Transaction),
          entry_id: descendant.id,
          root_id: descendant.root_id,
          workspace_id: descendant.workspace_id,
          operation: 'delete',
          created_at: new Date(),
          created_by: userId,
          server_created_at: new Date(),
        })
      );

      await database.transaction().execute(async (trx) => {
        await trx
          .deleteFrom('entry_transactions')
          .where('entry_id', 'in', entryIds)
          .execute();

        const createdTransactions = await trx
          .insertInto('entry_transactions')
          .returningAll()
          .values(transactionsToCreate)
          .execute();

        if (createdTransactions.length !== transactionsToCreate.length) {
          throw new Error('Failed to create transactions');
        }

        await trx.deleteFrom('entries').where('id', 'in', entryIds).execute();

        await trx
          .deleteFrom('entry_interactions')
          .where('entry_id', 'in', entryIds)
          .execute();

        await trx
          .deleteFrom('entry_embeddings')
          .where('entry_id', 'in', entryIds)
          .execute();

        await trx
          .updateTable('collaborations')
          .set({
            deleted_at: new Date(),
            deleted_by: userId,
          })
          .where('entry_id', 'in', entryIds)
          .execute();
      });

      for (const entry of descendants) {
        eventBus.publish({
          type: 'entry_deleted',
          entryId: entry.id,
          entryType: entry.type,
          rootId: entry.root_id,
          workspaceId: entry.workspace_id,
        });

        deletedEntryIds.push(entry.id);
      }

      hasMore = descendants.length === BATCH_SIZE;
    } catch (error) {
      logger.error(`Error cleaning entry data for ${parentIds}: ${error}`);
      hasMore = false;
    }
  }

  return deletedEntryIds;
};

const deleteMessages = async (entryIds: string[], userId: string) => {
  let hasMore = true;
  while (hasMore) {
    try {
      const messages = await database
        .selectFrom('messages')
        .selectAll()
        .where('entry_id', 'in', entryIds)
        .orderBy('id', 'asc')
        .limit(BATCH_SIZE)
        .execute();

      if (messages.length === 0) {
        hasMore = false;
        break;
      }

      const messageIds: string[] = messages.map((m) => m.id);
      const messageTombstonesToCreate: CreateMessageTombstone[] = messages.map(
        (message) => ({
          id: message.id,
          root_id: message.root_id,
          workspace_id: message.workspace_id,
          deleted_at: new Date(),
          deleted_by: userId,
        })
      );

      await database.transaction().execute(async (trx) => {
        await trx
          .deleteFrom('messages')
          .where('id', 'in', messageIds)
          .execute();

        await trx
          .deleteFrom('message_reactions')
          .where('message_id', 'in', messageIds)
          .execute();

        await trx
          .deleteFrom('message_interactions')
          .where('message_id', 'in', messageIds)
          .execute();

        await trx
          .deleteFrom('message_embeddings')
          .where('message_id', 'in', messageIds)
          .execute();

        await trx
          .insertInto('message_tombstones')
          .values(messageTombstonesToCreate)
          .execute();
      });

      for (const message of messages) {
        eventBus.publish({
          type: 'message_deleted',
          messageId: message.id,
          rootId: message.root_id,
          workspaceId: message.workspace_id,
        });
      }

      hasMore = messages.length === BATCH_SIZE;
    } catch (error) {
      logger.error(`Error deleting messages for ${entryIds}: ${error}`);
      hasMore = false;
    }
  }
};

const deleteFiles = async (entryIds: string[], userId: string) => {
  let hasMore = true;
  while (hasMore) {
    try {
      const files = await database
        .selectFrom('files')
        .selectAll()
        .where('entry_id', 'in', entryIds)
        .orderBy('id', 'asc')
        .limit(BATCH_SIZE)
        .execute();

      if (files.length === 0) {
        hasMore = false;
        break;
      }

      const fileIds: string[] = files.map((m) => m.id);
      const fileTombstonesToCreate: CreateFileTombstone[] = files.map(
        (file) => ({
          id: file.id,
          root_id: file.root_id,
          workspace_id: file.workspace_id,
          deleted_at: new Date(),
          deleted_by: userId,
        })
      );

      await database.transaction().execute(async (trx) => {
        await trx.deleteFrom('files').where('id', 'in', fileIds).execute();

        await trx
          .deleteFrom('file_interactions')
          .where('file_id', 'in', fileIds)
          .execute();

        await trx
          .insertInto('file_tombstones')
          .values(fileTombstonesToCreate)
          .execute();
      });

      for (const file of files) {
        eventBus.publish({
          type: 'file_deleted',
          fileId: file.id,
          rootId: file.root_id,
          workspaceId: file.workspace_id,
        });

        const path = `files/${file.workspace_id}/${file.id}${file.extension}`;
        const command = new DeleteObjectCommand({
          Bucket: BUCKET_NAMES.FILES,
          Key: path,
        });

        await filesStorage.send(command);
      }

      hasMore = files.length === BATCH_SIZE;
    } catch (error) {
      logger.error(`Error deleting files for ${entryIds}: ${error}`);
      hasMore = false;
    }
  }
};
