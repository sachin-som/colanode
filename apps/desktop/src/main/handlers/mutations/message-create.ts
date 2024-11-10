import { generateId, IdType, EditorNodeTypes, NodeTypes } from '@colanode/core';
import { MutationChange, MutationHandler, MutationResult } from '@/main/types';
import { MessageCreateMutationInput } from '@/operations/mutations/message-create';
import { mapContentsToBlocks } from '@/lib/editor';
import { fileManager } from '@/main/file-manager';
import { Block, FileAttributes, MessageAttributes } from '@colanode/core';
import { CreateNodeInput, nodeManager } from '@/main/node-manager';

export class MessageCreateMutationHandler
  implements MutationHandler<MessageCreateMutationInput>
{
  async handleMutation(
    input: MessageCreateMutationInput
  ): Promise<MutationResult<MessageCreateMutationInput>> {
    const inputs: CreateNodeInput[] = [];
    let hasFiles = false;

    const messageId = generateId(IdType.Message);
    const createdAt = new Date().toISOString();
    const blocks = mapContentsToBlocks(
      messageId,
      input.content.content ?? [],
      new Map()
    );

    // check if there are nested nodes (files, pages, folders etc.)
    for (const block of blocks) {
      if (block.type === EditorNodeTypes.FilePlaceholder) {
        const path = block.attrs?.path;
        const metadata = fileManager.getFileMetadata(path);
        if (!metadata) {
          throw new Error('Invalid file');
        }

        const fileId = generateId(IdType.File);

        block.id = fileId;
        block.type = NodeTypes.File;
        block.attrs = null;

        fileManager.copyFileToWorkspace(
          path,
          fileId,
          metadata.extension,
          input.userId
        );

        const fileAttributes: FileAttributes = {
          type: 'file',
          parentId: messageId,
          name: metadata.name,
          fileName: metadata.name,
          mimeType: metadata.mimeType,
          size: metadata.size,
          extension: metadata.extension,
        };

        inputs.push({
          id: fileId,
          attributes: fileAttributes,
          download: {
            node_id: fileId,
            created_at: createdAt,
            progress: 100,
            retry_count: 0,
          },
          upload: {
            node_id: fileId,
            created_at: createdAt,
            progress: 0,
            retry_count: 0,
          },
        });

        hasFiles = true;
      }
    }

    const messageAttributes: MessageAttributes = {
      type: 'message',
      parentId: input.conversationId,
      content: blocks.reduce(
        (acc, block) => {
          acc[block.id] = block;
          return acc;
        },
        {} as Record<string, Block>
      ),
      reactions: {},
    };

    inputs.unshift({ id: messageId, attributes: messageAttributes });
    await nodeManager.createNode(input.userId, inputs);

    const mutationChanges: MutationChange[] = [
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
    ];

    if (hasFiles) {
      mutationChanges.push({
        type: 'workspace',
        table: 'downloads',
        userId: input.userId,
      });

      mutationChanges.push({
        type: 'workspace',
        table: 'uploads',
        userId: input.userId,
      });
    }

    return {
      output: {
        id: messageId,
      },
      changes: mutationChanges,
    };
  }
}
