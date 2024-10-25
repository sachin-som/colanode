import fs from 'fs';
import mime from 'mime-types';
import path from 'path';
import * as Y from 'yjs';
import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { generateId, IdType } from '@/lib/id';
import { FileCreateMutationInput } from '@/operations/mutations/file-create';
import { NodeTypes } from '@/lib/constants';
import { fileManager } from '@/main/file-manager';
import { LocalCreateNodeChangeData } from '@/types/sync';
import { fromUint8Array } from 'js-base64';
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
    const versionId = generateId(IdType.Version);
    const createdAt = new Date().toISOString();

    fileManager.copyFileToWorkspace(filePath, id, extension, input.userId);

    const doc = new Y.Doc({
      guid: id,
    });

    const attributesMap = doc.getMap('attributes');
    doc.transact(() => {
      attributesMap.set('type', NodeTypes.File);
      attributesMap.set('parentId', input.parentId);
      attributesMap.set('name', fileName);
      attributesMap.set('fileName', fileName);
      attributesMap.set('extension', extension);
      attributesMap.set('size', size);
      attributesMap.set('mimeType', mimeType);
    });

    const attributes = JSON.stringify(attributesMap.toJSON());
    const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

    const changeData: LocalCreateNodeChangeData = {
      type: 'node_create',
      id: id,
      state: encodedState,
      createdAt: createdAt,
      createdBy: input.userId,
      versionId: versionId,
    };

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx
        .insertInto('nodes')
        .values({
          id: id,
          attributes: attributes,
          state: encodedState,
          created_at: createdAt,
          created_by: input.userId,
          version_id: versionId,
        })
        .execute();

      await trx
        .insertInto('changes')
        .values({
          data: JSON.stringify(changeData),
          created_at: createdAt,
        })
        .execute();

      await trx
        .insertInto('uploads')
        .values({
          node_id: id,
          created_at: new Date().toISOString(),
          progress: 0,
          retry_count: 0,
        })
        .execute();

      await trx
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
