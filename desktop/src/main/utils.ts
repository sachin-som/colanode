import { app } from 'electron';
import { DeleteResult, InsertResult, UpdateResult } from 'kysely';
import path from 'path';
import * as Y from 'yjs';
import { databaseManager } from '@/main/data/database-manager';
import { LocalNodeAttributes } from '@/types/nodes';
import { generateId, IdType } from '@/lib/id';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { LocalUpdateNodeChangeData } from '@/types/sync';

export const appPath = app.getPath('userData');

export const appDatabasePath = path.join(appPath, 'app.db');

export const getWorkspaceDirectoryPath = (userId: string): string => {
  return path.join(appPath, 'workspaces', userId);
};

export const getWorkspaceFilesDirectoryPath = (userId: string): string => {
  return path.join(getWorkspaceDirectoryPath(userId), 'files');
};

export const getAccountAvatarsDirectoryPath = (accountId: string): string => {
  return path.join(appPath, 'avatars', accountId);
};

export const hasInsertChanges = (result: InsertResult[]): boolean => {
  if (result.length === 0) {
    return false;
  }

  return result.some(
    (r) => r.numInsertedOrUpdatedRows && r.numInsertedOrUpdatedRows > 0n,
  );
};

export const hasUpdateChanges = (result: UpdateResult[]): boolean => {
  if (result.length === 0) {
    return false;
  }

  return result.some((r) => r.numUpdatedRows && r.numUpdatedRows > 0n);
};

export const hasDeleteChanges = (result: DeleteResult[]): boolean => {
  return result.some((r) => r.numDeletedRows && r.numDeletedRows > 0n);
};

export const updateNodeAtomically = async (
  userId: string,
  nodeId: string,
  update: (attributesMap: Y.Map<any>, attributes: LocalNodeAttributes) => void,
) => {
  const workspaceDatabase = await databaseManager.getWorkspaceDatabase(userId);

  let count = 0;
  while (count++ < 10) {
    const node = await workspaceDatabase
      .selectFrom('nodes')
      .select(['state', 'attributes', 'version_id'])
      .where('id', '=', nodeId)
      .executeTakeFirst();

    if (!node) {
      throw new Error('Node not found');
    }

    const doc = new Y.Doc({
      guid: nodeId,
    });
    Y.applyUpdate(doc, toUint8Array(node.state));

    const versionId = generateId(IdType.Version);
    const updatedAt = new Date().toISOString();
    const updates: string[] = [];

    doc.on('update', (update) => {
      updates.push(fromUint8Array(update));
    });

    const attributes = JSON.parse(node.attributes) as LocalNodeAttributes;
    const attributesMap = doc.getMap('attributes');

    doc.transact(() => {
      update(attributesMap, attributes);
    });

    if (updates.length === 0) {
      return true;
    }

    const attributesJson = JSON.stringify(attributesMap.toJSON());
    const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

    const changeData: LocalUpdateNodeChangeData = {
      type: 'node_update',
      id: nodeId,
      updatedAt: updatedAt,
      updatedBy: userId,
      versionId: versionId,
      updates: updates,
    };

    const result = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const result = await trx
          .updateTable('nodes')
          .set({
            attributes: attributesJson,
            state: encodedState,
            updated_at: updatedAt,
            updated_by: userId,
            version_id: versionId,
          })
          .where('id', '=', nodeId)
          .where('version_id', '=', node.version_id)
          .execute();

        const hasChanges = hasUpdateChanges(result);

        if (hasChanges) {
          await trx
            .insertInto('changes')
            .values({
              data: JSON.stringify(changeData),
              created_at: updatedAt,
            })
            .execute();
        }

        return hasChanges;
      });

    if (result) {
      return true;
    }
  }

  return false;
};
