import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/main/types';
import { generateId, IdType } from '@/lib/id';
import { FileCreateMutationInput } from '@/operations/mutations/file-create';
import { fileManager } from '@/main/file-manager';
import { FileAttributes } from '@colanode/core';
import { nodeManager } from '@/main/node-manager';
export class FileCreateMutationHandler
  implements MutationHandler<FileCreateMutationInput>
{
  async handleMutation(
    input: FileCreateMutationInput
  ): Promise<MutationResult<FileCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    const metadata = fileManager.getFileMetadata(input.filePath);
    if (!metadata) {
      throw new Error('Invalid file');
    }

    const id = generateId(IdType.File);
    fileManager.copyFileToWorkspace(
      input.filePath,
      id,
      metadata.extension,
      input.userId
    );

    const attributes: FileAttributes = {
      type: 'file',
      parentId: input.parentId,
      name: metadata.name,
      fileName: metadata.name,
      extension: metadata.extension,
      size: metadata.size,
      mimeType: metadata.mimeType,
    };

    await workspaceDatabase.transaction().execute(async (trx) => {
      await nodeManager.createNode(trx, input.userId, id, attributes);

      await trx
        .insertInto('uploads')
        .values({
          node_id: id,
          created_at: new Date().toISOString(),
          progress: 0,
          retry_count: 0,
        })
        .execute();

      await trx
        .insertInto('downloads')
        .values({
          node_id: id,
          created_at: new Date().toISOString(),
          progress: 100,
          retry_count: 0,
        })
        .execute();
    });

    return {
      output: {
        id: id,
      },
      changes: [
        {
          type: 'workspace',
          table: 'nodes',
          userId: input.userId,
        },
        {
          type: 'workspace',
          table: 'changes',
          userId: input.userId,
        },
        {
          type: 'workspace',
          table: 'downloads',
          userId: input.userId,
        },
        {
          type: 'workspace',
          table: 'uploads',
          userId: input.userId,
        },
      ],
    };
  }
}
