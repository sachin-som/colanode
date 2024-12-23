import {
  CreateFileMutationData,
  FileStatus,
  generateId,
  IdType,
} from '@colanode/core';

import { fileService } from '@/main/services/file-service';
import { MutationHandler } from '@/main/types';
import {
  FileCreateMutationInput,
  FileCreateMutationOutput,
} from '@/shared/mutations/files/file-create';
import { MutationError } from '@/shared/mutations';
import { databaseService } from '@/main/data/database-service';
import { eventBus } from '@/shared/lib/event-bus';
import { mapFile } from '@/main/utils';

export class FileCreateMutationHandler
  implements MutationHandler<FileCreateMutationInput>
{
  async handleMutation(
    input: FileCreateMutationInput
  ): Promise<FileCreateMutationOutput> {
    const metadata = fileService.getFileMetadata(input.filePath);
    if (!metadata) {
      throw new MutationError(
        'invalid_file',
        'File is invalid or could not be read.'
      );
    }

    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const fileId = generateId(IdType.File);

    fileService.copyFileToWorkspace(
      input.filePath,
      fileId,
      metadata.extension,
      input.userId
    );

    const mutationData: CreateFileMutationData = {
      id: fileId,
      type: metadata.type,
      parentId: input.parentId,
      rootId: input.rootId,
      name: metadata.name,
      originalName: metadata.name,
      extension: metadata.extension,
      mimeType: metadata.mimeType,
      size: metadata.size,
      createdAt: new Date().toISOString(),
    };

    const createdFile = await workspaceDatabase
      .transaction()
      .execute(async (tx) => {
        const createdFile = await tx
          .insertInto('files')
          .returningAll()
          .values({
            id: fileId,
            type: metadata.type,
            parent_id: input.parentId,
            root_id: input.rootId,
            name: metadata.name,
            original_name: metadata.name,
            mime_type: metadata.mimeType,
            size: metadata.size,
            extension: metadata.extension,
            created_at: new Date().toISOString(),
            created_by: input.userId,
            status: FileStatus.Pending,
            version: 0n,
          })
          .executeTakeFirst();

        if (!createdFile) {
          throw new Error('Failed to create file.');
        }

        await tx
          .insertInto('file_states')
          .values({
            file_id: fileId,
            created_at: new Date().toISOString(),
            download_progress: 100,
            download_status: 'completed',
            download_retries: 0,
            upload_progress: 0,
            upload_status: 'pending',
            upload_retries: 0,
          })
          .execute();

        await tx
          .insertInto('mutations')
          .values({
            id: generateId(IdType.Mutation),
            type: 'create_file',
            node_id: fileId,
            data: JSON.stringify(mutationData),
            created_at: new Date().toISOString(),
            retries: 0,
          })
          .execute();

        return createdFile;
      });

    if (!createdFile) {
      throw new Error('Failed to create file.');
    }

    eventBus.publish({
      type: 'file_created',
      userId: input.userId,
      file: mapFile(createdFile),
    });

    eventBus.publish({
      type: 'file_state_created',
      userId: input.userId,
      fileState: {
        fileId: fileId,
        downloadProgress: 100,
        downloadStatus: 'completed',
        downloadRetries: 0,
        uploadProgress: 10,
        uploadStatus: 'pending',
        uploadRetries: 0,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      },
    });

    return {
      id: fileId,
    };
  }
}
