import { MutationHandler, MutationResult } from '@/main/types';
import { generateId, IdType } from '@colanode/core';
import { FileCreateMutationInput } from '@/operations/mutations/file-create';
import { fileService } from '@/main/services/file-service';
import { FileAttributes } from '@colanode/core';
import { nodeService } from '@/main/services/node-service';

export class FileCreateMutationHandler
  implements MutationHandler<FileCreateMutationInput>
{
  async handleMutation(
    input: FileCreateMutationInput
  ): Promise<MutationResult<FileCreateMutationInput>> {
    const metadata = fileService.getFileMetadata(input.filePath);
    if (!metadata) {
      throw new Error('Invalid file');
    }

    const id = generateId(IdType.File);
    fileService.copyFileToWorkspace(
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

    await nodeService.createNode(input.userId, {
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
