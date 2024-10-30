import * as Y from 'yjs';
import { databaseManager } from '@/main/data/database-manager';
import { EditorNodeTypes, NodeTypes } from '@/lib/constants';
import { generateId, IdType } from '@/lib/id';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/operations/mutations';
import { MessageCreateMutationInput } from '@/operations/mutations/message-create';
import { fromUint8Array } from 'js-base64';
import { LocalCreateNodeChangeData } from '@/types/sync';
import { applyChangeToAttributesMap, mapContentsToBlocks } from '@/lib/editor';
import { fileManager } from '@/main/file-manager';
import {
  CreateChange,
  CreateDownload,
  CreateNode,
  CreateUpload,
} from '@/main/data/workspace/schema';

export class MessageCreateMutationHandler
  implements MutationHandler<MessageCreateMutationInput>
{
  async handleMutation(
    input: MessageCreateMutationInput,
  ): Promise<MutationResult<MessageCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const nodesToCreate: CreateNode[] = [];
    const downloadsToCreate: CreateDownload[] = [];
    const uploadsToCreate: CreateUpload[] = [];
    const changesToCreate: CreateChange[] = [];

    const messageId = generateId(IdType.Message);
    const messageVersionId = generateId(IdType.Version);
    const createdAt = new Date().toISOString();
    const blocks = mapContentsToBlocks(
      messageId,
      input.content.content,
      new Map(),
    );

    // check if there are nested nodes (files, pages, folders etc.)
    for (const block of blocks) {
      if (block.type === EditorNodeTypes.FilePlaceholder) {
        const path = block.attrs.path;
        const metadata = fileManager.getFileMetadata(path);
        if (!metadata) {
          throw new Error('Invalid file');
        }

        const fileId = generateId(IdType.File);
        const fileVersionId = generateId(IdType.Version);

        block.id = fileId;
        block.type = NodeTypes.File;
        block.attrs = null;

        fileManager.copyFileToWorkspace(
          path,
          fileId,
          metadata.extension,
          input.userId,
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

        const fileAttributes = JSON.stringify(fileAttributesMap.toJSON());
        const encodedFileState = fromUint8Array(Y.encodeStateAsUpdate(fileDoc));

        nodesToCreate.push({
          id: fileId,
          attributes: fileAttributes,
          state: encodedFileState,
          created_at: createdAt,
          created_by: input.userId,
          version_id: fileVersionId,
        });

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

    const messageDoc = new Y.Doc({
      guid: messageId,
    });

    const messageAttributesMap = messageDoc.getMap('attributes');
    messageDoc.transact(() => {
      messageAttributesMap.set('type', NodeTypes.Message);
      messageAttributesMap.set('parentId', input.conversationId);
      applyChangeToAttributesMap(messageAttributesMap, blocks);
    });

    const messageAttributes = JSON.stringify(messageAttributesMap.toJSON());
    const encodedMessageState = fromUint8Array(
      Y.encodeStateAsUpdate(messageDoc),
    );

    nodesToCreate.unshift({
      id: messageId,
      attributes: messageAttributes,
      state: encodedMessageState,
      created_at: createdAt,
      created_by: input.userId,
      version_id: messageVersionId,
    });

    for (const nodeToCreate of nodesToCreate) {
      const changeData: LocalCreateNodeChangeData = {
        type: 'node_create',
        id: nodeToCreate.id,
        state: nodeToCreate.state,
        createdAt: nodeToCreate.created_at,
        createdBy: nodeToCreate.created_by,
        versionId: nodeToCreate.version_id,
      };

      changesToCreate.push({
        data: JSON.stringify(changeData),
        created_at: createdAt,
      });
    }

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx.insertInto('nodes').values(nodesToCreate).execute();
      await trx.insertInto('changes').values(changesToCreate).execute();

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
