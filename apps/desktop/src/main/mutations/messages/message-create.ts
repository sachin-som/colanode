import {
  Block,
  canCreateMessage,
  CreateFileMutationData,
  CreateMessageMutationData,
  EditorNodeTypes,
  FileStatus,
  generateId,
  IdType,
  MessageAttributes,
  MessageType,
} from '@colanode/core';

import { MutationHandler } from '@/main/types';
import { mapContentsToBlocks } from '@/shared/lib/editor';
import {
  MessageCreateMutationInput,
  MessageCreateMutationOutput,
} from '@/shared/mutations/messages/message-create';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  CreateFile,
  CreateFileState,
  CreateMutation,
} from '@/main/databases/workspace';
import { eventBus } from '@/shared/lib/event-bus';
import {
  fetchEntry,
  fetchUser,
  fetchUserStorageUsed,
  getFileMetadata,
  mapEntry,
  mapFile,
  mapFileState,
  mapMessage,
} from '@/main/utils';
import { formatBytes } from '@/shared/lib/files';
import { DownloadStatus, UploadStatus } from '@/shared/types/files';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class MessageCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<MessageCreateMutationInput>
{
  async handleMutation(
    input: MessageCreateMutationInput
  ): Promise<MessageCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const user = await fetchUser(workspace.database, workspace.userId);
    if (!user) {
      throw new MutationError(
        MutationErrorCode.UserNotFound,
        'There was an error while fetching the user. Please make sure you are logged in.'
      );
    }

    const entry = await fetchEntry(workspace.database, input.conversationId);
    if (!entry) {
      throw new MutationError(
        MutationErrorCode.EntryNotFound,
        'There was an error while fetching the conversation. Please make sure you have access to this conversation.'
      );
    }

    const root = await fetchEntry(workspace.database, input.rootId);
    if (!root) {
      throw new MutationError(
        MutationErrorCode.RootNotFound,
        'There was an error while fetching the root. Please make sure you have access to this root.'
      );
    }

    if (
      !canCreateMessage({
        user: {
          userId: workspace.userId,
          role: user.role,
        },
        root: mapEntry(root),
        entry: mapEntry(entry),
      })
    ) {
      throw new MutationError(
        MutationErrorCode.MessageCreateForbidden,
        'You are not allowed to create a message in this conversation.'
      );
    }

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
        const metadata = getFileMetadata(path);
        if (!metadata) {
          throw new MutationError(
            MutationErrorCode.FileInvalid,
            'The file attachment is invalid or could not be read.'
          );
        }

        if (metadata.size > user.max_file_size) {
          throw new MutationError(
            MutationErrorCode.FileTooLarge,
            'The file you are trying to upload is too large. The maximum file size is ' +
              formatBytes(user.max_file_size)
          );
        }

        const fileId = generateId(IdType.File);
        block.id = fileId;
        block.type = 'file';
        block.attrs = null;

        workspace.files.copyFileToWorkspace(path, fileId, metadata.extension);

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
          created_by: workspace.userId,
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
          data: JSON.stringify(mutationData),
          created_at: createdAt,
          retries: 0,
        });

        fileStates.push({
          file_id: fileId,
          upload_status: UploadStatus.Pending,
          upload_progress: 0,
          upload_retries: 0,
          download_status: DownloadStatus.Completed,
          download_progress: 100,
          download_retries: 0,
          created_at: createdAt,
        });
      }
    }

    if (files.length > 0) {
      const storageUsed = await fetchUserStorageUsed(
        workspace.database,
        workspace.userId
      );

      const fileSizeSum = BigInt(
        files.reduce((sum, file) => sum + file.size, 0)
      );

      if (storageUsed + fileSizeSum > user.storage_limit) {
        for (const file of files) {
          workspace.files.deleteFile(file.id, file.extension);
        }

        throw new MutationError(
          MutationErrorCode.StorageLimitExceeded,
          'You have reached your storage limit. You have used ' +
            formatBytes(storageUsed) +
            ' and you are trying to upload files of size ' +
            formatBytes(fileSizeSum) +
            '. Your storage limit is ' +
            formatBytes(user.storage_limit)
        );
      }
    }

    const blocksRecord = blocks.reduce(
      (acc, block) => {
        acc[block.id] = block;
        return acc;
      },
      {} as Record<string, Block>
    );

    const messageAttributes: MessageAttributes = {
      type: MessageType.Standard,
      blocks: blocksRecord,
      referenceId: input.referenceId,
    };

    const { createdMessage, createdFiles, createdFileStates } =
      await workspace.database.transaction().execute(async (tx) => {
        const createdMessage = await tx
          .insertInto('messages')
          .returningAll()
          .values({
            id: messageId,
            entry_id: input.conversationId,
            parent_id: input.conversationId,
            root_id: input.rootId,
            attributes: JSON.stringify(messageAttributes),
            created_at: createdAt,
            created_by: workspace.userId,
            version: 0n,
          })
          .executeTakeFirst();

        if (!createdMessage) {
          throw new Error('Failed to create message.');
        }

        const createMessageMutationData: CreateMessageMutationData = {
          id: messageId,
          entryId: input.conversationId,
          parentId: input.conversationId,
          rootId: input.rootId,
          attributes: messageAttributes,
          createdAt: createdAt,
        };

        await tx
          .insertInto('mutations')
          .values({
            id: generateId(IdType.Mutation),
            type: 'create_message',
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

    workspace.mutations.triggerSync();

    if (createdMessage) {
      eventBus.publish({
        type: 'message_created',
        accountId: workspace.accountId,
        workspaceId: workspace.id,
        message: mapMessage(createdMessage),
      });
    }

    if (createdFiles) {
      for (const file of createdFiles) {
        eventBus.publish({
          type: 'file_created',
          accountId: workspace.accountId,
          workspaceId: workspace.id,
          file: mapFile(file),
        });
      }
    }

    if (createdFileStates) {
      for (const fileState of createdFileStates) {
        eventBus.publish({
          type: 'file_state_created',
          accountId: workspace.accountId,
          workspaceId: workspace.id,
          fileState: mapFileState(fileState),
        });
      }
    }

    return {
      id: messageId,
    };
  }
}
