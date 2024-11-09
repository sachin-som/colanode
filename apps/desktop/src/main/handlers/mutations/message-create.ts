import * as Y from 'yjs';
import { databaseManager } from '@/main/data/database-manager';
import { generateId, IdType, EditorNodeTypes, NodeTypes } from '@colanode/core';
import { MutationChange, MutationHandler, MutationResult } from '@/main/types';
import { MessageCreateMutationInput } from '@/operations/mutations/message-create';
import { mapContentsToBlocks } from '@/lib/editor';
import { fileManager } from '@/main/file-manager';
import { CreateDownload, CreateUpload } from '@/main/data/workspace/schema';
import {
  NodeAttributes,
  Block,
  FileAttributes,
  MessageAttributes,
} from '@colanode/core';
import { nodeManager } from '@/main/node-manager';

export class MessageCreateMutationHandler
  implements MutationHandler<MessageCreateMutationInput>
{
  async handleMutation(
    input: MessageCreateMutationInput
  ): Promise<MutationResult<MessageCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    const nodeAttributes: NodeAttributes[] = [];
    const downloadsToCreate: CreateDownload[] = [];
    const uploadsToCreate: CreateUpload[] = [];

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

        const fileDoc = new Y.Doc({
          guid: fileId,
        });

        const fileAttributesMap = fileDoc.getMap('attributes');
        fileDoc.transact(() => {
          fileAttributesMap.set('type', NodeTypes.File);
          fileAttributesMap.set('parentId', messageId);
          fileAttributesMap.set('name', metadata.name);
          fileAttributesMap.set('fileName', metadata.name);
          fileAttributesMap.set('extension', metadata.extension);
          fileAttributesMap.set('size', metadata.size);
          fileAttributesMap.set('mimeType', metadata.mimeType);
        });

        const fileAttributes: FileAttributes = {
          type: 'file',
          parentId: messageId,
          name: metadata.name,
          fileName: metadata.name,
          mimeType: metadata.mimeType,
          size: metadata.size,
          extension: metadata.extension,
        };

        nodeAttributes.push(fileAttributes);

        downloadsToCreate.push({
          node_id: fileId,
          created_at: createdAt,
          progress: 100,
          retry_count: 0,
        });

        uploadsToCreate.push({
          node_id: fileId,
          created_at: createdAt,
          progress: 0,
          retry_count: 0,
        });
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

    nodeAttributes.unshift(messageAttributes);

    await workspaceDatabase.transaction().execute(async (trx) => {
      for (const nodeAttribute of nodeAttributes) {
        await nodeManager.createNode(
          trx,
          input.userId,
          messageId,
          nodeAttribute
        );
      }

      if (uploadsToCreate.length > 0) {
        await trx.insertInto('uploads').values(uploadsToCreate).execute();
      }

      if (downloadsToCreate.length > 0) {
        await trx.insertInto('downloads').values(downloadsToCreate).execute();
      }
    });

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

    if (downloadsToCreate.length > 0) {
      mutationChanges.push({
        type: 'workspace',
        table: 'downloads',
        userId: input.userId,
      });
    }

    if (uploadsToCreate.length > 0) {
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
