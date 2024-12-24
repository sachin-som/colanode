import { generateId, IdType } from '@colanode/core';
// import { DeleteObjectCommand } from '@aws-sdk/client-s3';

import { database } from '@/data/database';
import { CreateTransaction } from '@/data/schema';
import { JobHandler } from '@/types/jobs';
// import { filesStorage, BUCKET_NAMES } from '@/data/storage';
import { eventBus } from '@/lib/event-bus';
import { createLogger } from '@/lib/logger';

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
    .selectFrom('transactions')
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

  const parentIds = [input.entryId];
  while (parentIds.length > 0) {
    const tempParentIds = parentIds.splice(0, BATCH_SIZE);
    const deletedEntryIds = await deleteChildren(
      tempParentIds,
      input.workspaceId,
      deleteTransaction.created_by
    );

    parentIds.push(...deletedEntryIds);
  }
};

const deleteChildren = async (
  parentIds: string[],
  workspaceId: string,
  userId: string
) => {
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

      // const fileIds: string[] = descendants
      //   .filter((d) => d.type === 'file')
      //   .map((d) => d.id);

      // const uploads: SelectUpload[] =
      //   fileIds.length > 0
      //     ? await database
      //         .selectFrom('uploads')
      //         .selectAll()
      //         .where('node_id', 'in', fileIds)
      //         .execute()
      //     : [];

      const entryIds: string[] = descendants.map((d) => d.id);
      const transactionsToCreate: CreateTransaction[] = descendants.map(
        (descendant) => ({
          id: generateId(IdType.Transaction),
          entry_id: descendant.id,
          root_id: descendant.root_id,
          workspace_id: workspaceId,
          operation: 'delete',
          created_at: new Date(),
          created_by: userId,
          server_created_at: new Date(),
        })
      );
      // const uploadsToDelete: string[] = uploads.map((u) => u.node_id);

      await database.transaction().execute(async (trx) => {
        await trx
          .deleteFrom('transactions')
          .where('entry_id', 'in', entryIds)
          .execute();

        const createdTransactions = await trx
          .insertInto('transactions')
          .returningAll()
          .values(transactionsToCreate)
          .execute();

        if (createdTransactions.length !== transactionsToCreate.length) {
          throw new Error('Failed to create transactions');
        }

        // if (uploadsToDelete.length > 0) {
        //   await trx
        //     .deleteFrom('uploads')
        //     .where('node_id', 'in', uploadsToDelete)
        //     .execute();
        // }

        await trx.deleteFrom('entries').where('id', 'in', entryIds).execute();
        await trx
          .updateTable('collaborations')
          .set({
            deleted_at: new Date(),
            deleted_by: userId,
          })
          .where('entry_id', 'in', entryIds)
          .execute();
      });

      // for (const upload of uploads) {
      //   const command = new DeleteObjectCommand({
      //     Bucket: BUCKET_NAMES.FILES,
      //     Key: upload.path,
      //   });

      //   logger.trace(
      //     `Deleting file as a descendant of ${parentIds}: ${upload.path}`
      //   );

      //   await filesStorage.send(command);
      // }

      for (const entry of descendants) {
        logger.trace(`Publishing entry deleted event for ${entry.id}`);

        eventBus.publish({
          type: 'entry_deleted',
          entryId: entry.id,
          entryType: entry.type,
          rootId: entry.root_id,
          workspaceId: workspaceId,
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
