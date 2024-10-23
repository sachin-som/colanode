import fs from 'fs';
import mime from 'mime-types';
import path from 'path';
import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { generateId, IdType } from '@/lib/id';
import { FileCreateMutationInput } from '@/operations/mutations/file-create';
import { buildCreateNode } from '@/lib/nodes';
import { NodeTypes } from '@/lib/constants';
import { fileManager } from '@/main/file-manager';

export class FileCreateMutationHandler
  implements MutationHandler<FileCreateMutationInput>
{
  async handleMutation(
    input: FileCreateMutationInput,
  ): Promise<MutationResult<FileCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const filePath = input.filePath;
    const fileName = path.basename(filePath);
    const extension = path.extname(filePath);
    const stats = fs.statSync(filePath);

    const size = stats.size;
    const mimeType = mime.lookup(filePath);
    if (mimeType === false) {
      throw new Error('Invalid file type');
    }

    const id = generateId(IdType.File);
    fileManager.copyFileToWorkspace(filePath, id, extension, input.userId);

    await workspaceDatabase.transaction().execute(async (tx) => {
      await tx
        .insertInto('nodes')
        .values(
          buildCreateNode(
            {
              id: id,
              attributes: {
                type: NodeTypes.File,
                parentId: input.parentId,
                name: fileName,
                fileName: fileName,
                extension: extension,
                size: size,
                mimeType: mimeType,
              },
            },
            input.userId,
          ),
        )
        .execute();

      await tx
        .insertInto('uploads')
        .values({
          node_id: id,
          created_at: new Date().toISOString(),
          progress: 0,
          retry_count: 0,
        })
        .execute();

      await tx
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
