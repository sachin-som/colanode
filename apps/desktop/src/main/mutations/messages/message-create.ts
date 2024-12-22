import {
  Block,
  EditorNodeTypes,
  FileStatus,
  generateId,
  IdType,
  MessageAttributes,
  NodeTypes,
} from '@colanode/core';

import { fileService } from '@/main/services/file-service';
import { CreateNodeInput, nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { mapContentsToBlocks } from '@/shared/lib/editor';
import {
  MessageCreateMutationInput,
  MessageCreateMutationOutput,
} from '@/shared/mutations/messages/message-create';
import { MutationError } from '@/shared/mutations';
import { CreateFile, CreateFileState } from '@/main/data/workspace/schema';
import { databaseService } from '@/main/data/database-service';
import { eventBus } from '@/shared/lib/event-bus';
import { mapFile, mapFileState } from '@/main/utils';

export class MessageCreateMutationHandler
  implements MutationHandler<MessageCreateMutationInput>
{
  async handleMutation(
    input: MessageCreateMutationInput
  ): Promise<MessageCreateMutationOutput> {
    const inputs: CreateNodeInput[] = [];

    const messageContent = input.content.content ?? [];
    const messageId = generateId(IdType.Message);
    const createdAt = new Date().toISOString();
    const blocks = mapContentsToBlocks(messageId, messageContent, new Map());
    const files: CreateFile[] = [];
    const fileStates: CreateFileState[] = [];

    // check if there are nested nodes (files, pages, folders etc.)
    for (const block of blocks) {
      if (block.type === EditorNodeTypes.FilePlaceholder) {
        const path = block.attrs?.path;
        const metadata = fileService.getFileMetadata(path);
        if (!metadata) {
          throw new MutationError(
            'invalid_file',
            'File attachment is invalid or could not be read.'
          );
        }

        const fileId = generateId(IdType.File);
        block.id = fileId;
        block.type = NodeTypes.File;
        block.attrs = null;

        fileService.copyFileToWorkspace(
          path,
          fileId,
          metadata.extension,
          input.userId
        );

        files.push({
          id: fileId,
          type: metadata.type,
          status: FileStatus.Pending,
          parent_id: messageId,
          root_id: messageId,
          name: metadata.name,
          original_name: metadata.name,
          mime_type: metadata.mimeType,
          extension: metadata.extension,
          size: metadata.size,
          created_at: createdAt,
          created_by: input.userId,
          version: 0n,
        });

        fileStates.push({
          file_id: fileId,
          upload_status: 'pending',
          upload_progress: 0,
          upload_retries: 0,
          download_status: 'pending',
          download_progress: 0,
          download_retries: 0,
          created_at: createdAt,
        });
      }
    }

    const blocksRecord = blocks.reduce(
      (acc, block) => {
        acc[block.id] = block;
        return acc;
      },
      {} as Record<string, Block>
    );

    if (input.referenceId) {
      const reference = await nodeService.fetchNode(
        input.referenceId,
        input.userId
      );

      if (!reference || reference.type !== 'message') {
        throw new MutationError(
          'node_not_found',
          'Referenced message not found or has been deleted.'
        );
      }

      const messageAttributes: MessageAttributes = {
        type: 'message',
        subtype: 'reply',
        parentId: input.conversationId,
        referenceId: input.referenceId,
        content: blocksRecord,
        reactions: {},
      };

      inputs.unshift({ id: messageId, attributes: messageAttributes });
    } else {
      const messageAttributes: MessageAttributes = {
        type: 'message',
        subtype: 'standard',
        parentId: input.conversationId,
        content: blocksRecord,
        reactions: {},
      };

      inputs.unshift({ id: messageId, attributes: messageAttributes });
    }

    await nodeService.createNode(input.userId, inputs);

    if (files.length > 0) {
      const workspaceDatabase = await databaseService.getWorkspaceDatabase(
        input.userId
      );

      const { createdFiles, createdFileStates } = await workspaceDatabase
        .transaction()
        .execute(async (tx) => {
          const createdFiles = await tx
            .insertInto('files')
            .returningAll()
            .values(files)
            .execute();

          if (createdFiles.length !== files.length) {
            throw new Error('Failed to create files.');
          }

          const createdFileStates = await tx
            .insertInto('file_states')
            .returningAll()
            .values(fileStates)
            .execute();

          if (createdFileStates.length !== fileStates.length) {
            throw new Error('Failed to create file states.');
          }

          return {
            createdFiles,
            createdFileStates,
          };
        });

      for (const file of createdFiles) {
        eventBus.publish({
          type: 'file_created',
          userId: input.userId,
          file: mapFile(file),
        });
      }

      for (const fileState of createdFileStates) {
        eventBus.publish({
          type: 'file_state_created',
          userId: input.userId,
          fileState: mapFileState(fileState),
        });
      }
    }

    return {
      id: messageId,
    };
  }
}
