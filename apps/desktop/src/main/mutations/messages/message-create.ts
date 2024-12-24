import {
  Block,
  CreateFileMutationData,
  CreateMessageMutationData,
  EditorNodeTypes,
  FileStatus,
  generateId,
  IdType,
  MessageContent,
} from '@colanode/core';

import { fileService } from '@/main/services/file-service';
import { MutationHandler } from '@/main/types';
import { mapContentsToBlocks } from '@/shared/lib/editor';
import {
  MessageCreateMutationInput,
  MessageCreateMutationOutput,
} from '@/shared/mutations/messages/message-create';
import { MutationError } from '@/shared/mutations';
import {
  CreateFile,
  CreateFileState,
  CreateMutation,
} from '@/main/data/workspace/schema';
import { databaseService } from '@/main/data/database-service';
import { eventBus } from '@/shared/lib/event-bus';
import { mapFile, mapFileState, mapMessage } from '@/main/utils';

export class MessageCreateMutationHandler
  implements MutationHandler<MessageCreateMutationInput>
{
  async handleMutation(
    input: MessageCreateMutationInput
  ): Promise<MessageCreateMutationOutput> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const editorContent = input.content.content ?? [];
    const messageId = generateId(IdType.Message);
    const createdAt = new Date().toISOString();
    const blocks = mapContentsToBlocks(messageId, editorContent, new Map());

    const files: CreateFile[] = [];
    const fileStates: CreateFileState[] = [];
    const fileMutations: CreateMutation[] = [];

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
        block.type = 'file';
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
          entry_id: input.conversationId,
          root_id: input.rootId,
          name: metadata.name,
          original_name: metadata.name,
          mime_type: metadata.mimeType,
          extension: metadata.extension,
          size: metadata.size,
          created_at: createdAt,
          created_by: input.userId,
          version: 0n,
        });

        const mutationData: CreateFileMutationData = {
          id: fileId,
          type: metadata.type,
          parentId: messageId,
          entryId: input.conversationId,
          rootId: input.rootId,
          name: metadata.name,
          originalName: metadata.name,
          extension: metadata.extension,
          mimeType: metadata.mimeType,
          size: metadata.size,
          createdAt: createdAt,
        };

        fileMutations.push({
          id: generateId(IdType.Mutation),
          type: 'create_file',
          node_id: fileId,
          data: JSON.stringify(mutationData),
          created_at: createdAt,
          retries: 0,
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

    const messageContent: MessageContent = {
      blocks: blocksRecord,
    };

    const { createdMessage, createdFiles, createdFileStates } =
      await workspaceDatabase.transaction().execute(async (tx) => {
        const createdMessage = await tx
          .insertInto('messages')
          .returningAll()
          .values({
            id: messageId,
            type: 'standard',
            entry_id: input.conversationId,
            parent_id: input.conversationId,
            root_id: input.rootId,
            content: JSON.stringify(messageContent),
            created_at: createdAt,
            created_by: input.userId,
            version: 0n,
          })
          .executeTakeFirst();

        if (!createdMessage) {
          throw new Error('Failed to create message.');
        }

        const createMessageMutationData: CreateMessageMutationData = {
          id: messageId,
          type: 'standard',
          entryId: input.conversationId,
          parentId: input.conversationId,
          rootId: input.rootId,
          content: messageContent,
          createdAt: createdAt,
        };

        await tx
          .insertInto('mutations')
          .values({
            id: generateId(IdType.Mutation),
            type: 'create_message',
            node_id: messageId,
            data: JSON.stringify(createMessageMutationData),
            created_at: createdAt,
            retries: 0,
          })
          .execute();

        if (files.length > 0) {
          const createdFiles = await tx
            .insertInto('files')
            .returningAll()
            .values(files)
            .execute();

          if (createdFiles.length !== files.length) {
            throw new Error('Failed to create files.');
          }

          await tx.insertInto('mutations').values(fileMutations).execute();

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
            createdMessage,
          };
        }

        return {
          createdMessage,
        };
      });

    if (createdMessage) {
      eventBus.publish({
        type: 'message_created',
        userId: input.userId,
        message: mapMessage(createdMessage),
      });
    }

    if (createdFiles) {
      for (const file of createdFiles) {
        eventBus.publish({
          type: 'file_created',
          userId: input.userId,
          file: mapFile(file),
        });
      }
    }

    if (createdFileStates) {
      for (const fileState of createdFileStates) {
        eventBus.publish({
          type: 'file_state_created',
          userId: input.userId,
          fileState: mapFileState(fileState),
        });
      }
    }

    eventBus.publish({
      type: 'mutation_created',
      userId: input.userId,
    });

    return {
      id: messageId,
    };
  }
}
