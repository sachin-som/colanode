import { MutationHandler, MutationResult } from '@/main/types';
import { generateId, IdType } from '@colanode/core';
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

    await nodeManager.createNode(input.userId, {
      id,
      attributes,
      upload: {
        node_id: id,
        created_at: new Date().toISOString(),
        progress: 0,
        retry_count: 0,
      },
      download: {
        node_id: id,
        created_at: new Date().toISOString(),
        progress: 0,
        retry_count: 0,
      },
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
