import { createDebugger } from '@colanode/core';

import { database } from '@/data/database';
import { JobHandler } from '@/types/jobs';
import { eventBus } from '@/lib/event-bus';
import { CreateNodeTombstone } from '@/data/schema';

const BATCH_SIZE = 100;

const debug = createDebugger('server:job:clean-node-data');

export type CleanNodeDataInput = {
  type: 'clean_node_data';
  nodeId: string;
  workspaceId: string;
  userId: string;
};

declare module '@/types/jobs' {
  interface JobMap {
    clean_node_data: {
      input: CleanNodeDataInput;
    };
  }
}

export const cleanNodeDataHandler: JobHandler<CleanNodeDataInput> = async (
  input
) => {
  debug(`Cleaning node data for ${input.nodeId}`);
  const parentIds = [input.nodeId];
  while (parentIds.length > 0) {
    const tempParentIds = parentIds.splice(0, BATCH_SIZE);
    const deletedNodeIds = await deleteChildren(tempParentIds, input.userId);
    parentIds.push(...deletedNodeIds);
  }
};

const deleteChildren = async (parentIds: string[], userId: string) => {
  const deletedNodeIds: string[] = [];
  let hasMore = true;
  while (hasMore) {
    try {
      const descendants = await database
        .selectFrom('nodes')
        .selectAll()
        .where('parent_id', 'in', parentIds)
        .orderBy('id', 'asc')
        .limit(BATCH_SIZE)
        .execute();

      if (descendants.length === 0) {
        debug(`No descendants found for ${parentIds}`);
        hasMore = false;
        break;
      }

      const nodeIds: string[] = descendants.map((d) => d.id);
      const nodeTombstonesToCreate: CreateNodeTombstone[] = descendants.map(
        (node) => ({
          id: node.id,
          root_id: node.root_id,
          workspace_id: node.workspace_id,
          deleted_at: new Date(),
          deleted_by: userId,
        })
      );

      await database.transaction().execute(async (trx) => {
        await trx.deleteFrom('nodes').where('id', 'in', nodeIds).execute();

        await trx
          .deleteFrom('node_interactions')
          .where('node_id', 'in', nodeIds)
          .execute();

        await trx
          .deleteFrom('node_reactions')
          .where('node_id', 'in', nodeIds)
          .execute();

        await trx
          .deleteFrom('node_embeddings')
          .where('node_id', 'in', nodeIds)
          .execute();

        await trx
          .deleteFrom('document_embeddings')
          .where('document_id', 'in', nodeIds)
          .execute();

        await trx
          .updateTable('collaborations')
          .set({
            deleted_at: new Date(),
            deleted_by: userId,
          })
          .where('node_id', 'in', nodeIds)
          .execute();

        await trx
          .insertInto('node_tombstones')
          .values(nodeTombstonesToCreate)
          .execute();
      });

      for (const node of descendants) {
        eventBus.publish({
          type: 'node_deleted',
          nodeId: node.id,
          rootId: node.root_id,
          workspaceId: node.workspace_id,
        });

        deletedNodeIds.push(node.id);
      }

      hasMore = descendants.length === BATCH_SIZE;
    } catch (error) {
      debug(`Error cleaning node data for ${parentIds}: ${error}`);
      hasMore = false;
    }
  }

  return deletedNodeIds;
};

// const deleteFiles = async (entryIds: string[], userId: string) => {
//   let hasMore = true;
//   while (hasMore) {
//     try {
//       const files = await database
//         .selectFrom('files')
//         .selectAll()
//         .where('entry_id', 'in', entryIds)
//         .orderBy('id', 'asc')
//         .limit(BATCH_SIZE)
//         .execute();

//       if (files.length === 0) {
//         hasMore = false;
//         break;
//       }

//       const fileIds: string[] = files.map((m) => m.id);
//       const fileTombstonesToCreate: CreateFileTombstone[] = files.map(
//         (file) => ({
//           id: file.id,
//           root_id: file.root_id,
//           workspace_id: file.workspace_id,
//           deleted_at: new Date(),
//           deleted_by: userId,
//         })
//       );

//       await database.transaction().execute(async (trx) => {
//         await trx.deleteFrom('files').where('id', 'in', fileIds).execute();

//         await trx
//           .deleteFrom('file_interactions')
//           .where('file_id', 'in', fileIds)
//           .execute();

//         await trx
//           .insertInto('file_tombstones')
//           .values(fileTombstonesToCreate)
//           .execute();
//       });

//       for (const file of files) {
//         eventBus.publish({
//           type: 'file_deleted',
//           fileId: file.id,
//           rootId: file.root_id,
//           workspaceId: file.workspace_id,
//         });

//         const path = `files/${file.workspace_id}/${file.id}${file.extension}`;
//         const command = new DeleteObjectCommand({
//           Bucket: configuration.fileS3.bucketName,
//           Key: path,
//         });

//         await fileS3.send(command);
//       }

//       hasMore = files.length === BATCH_SIZE;
//     } catch (error) {
//       debug(`Error deleting files for ${entryIds}: ${error}`);
//       hasMore = false;
//     }
//   }
// };
