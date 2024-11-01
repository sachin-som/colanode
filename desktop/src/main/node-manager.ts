import * as Y from 'yjs';
import { LocalNodeAttributes } from '@/types/nodes';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { applyCrdt } from '@/main/crdt';
import {
  LocalCreateNodeChangeData,
  LocalUpdateNodeChangeData,
} from '@/types/sync';
import { registryMap } from '@/registry';
import { generateId } from '@/lib/id';
import { IdType } from '@/lib/id';
import { databaseManager } from '@/main/data/database-manager';
import { hasUpdateChanges } from '@/main/utils';
import { Transaction } from 'kysely';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';

class NodeManager {
  async createNode(
    transaction: Transaction<WorkspaceDatabaseSchema>,
    userId: string,
    id: string,
    attributes: LocalNodeAttributes,
  ) {
    const doc = new Y.Doc({
      guid: id,
    });
    const attributesMap = doc.getMap('attributes');

    const registry = registryMap[attributes.type];
    if (!registry) {
      throw new Error('Invalid node type');
    }

    applyCrdt(registry.schema, attributes, attributesMap);
    const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

    const createdAt = new Date().toISOString();
    const versionId = generateId(IdType.Version);

    const changeData: LocalCreateNodeChangeData = {
      type: 'node_create',
      id: id,
      state: encodedState,
      createdAt: createdAt,
      createdBy: userId,
      versionId: versionId,
    };

    await transaction
      .insertInto('nodes')
      .values({
        id: id,
        attributes: JSON.stringify(attributes),
        state: encodedState,
        created_at: createdAt,
        created_by: userId,
        version_id: versionId,
      })
      .execute();

    await transaction
      .insertInto('changes')
      .values({
        data: JSON.stringify(changeData),
        created_at: createdAt,
        retry_count: 0,
      })
      .execute();
  }

  async updateNode(
    userId: string,
    id: string,
    updater: (attributes: LocalNodeAttributes) => LocalNodeAttributes,
  ) {
    const workspaceDatabase =
      await databaseManager.getWorkspaceDatabase(userId);

    let count = 0;
    while (count++ < 20) {
      const node = await workspaceDatabase
        .selectFrom('nodes')
        .select(['state', 'attributes', 'version_id'])
        .where('id', '=', id)
        .executeTakeFirst();

      if (!node) {
        throw new Error('Node not found');
      }

      const doc = new Y.Doc({
        guid: id,
      });
      Y.applyUpdate(doc, toUint8Array(node.state));

      const versionId = generateId(IdType.Version);
      const updatedAt = new Date().toISOString();
      const updates: string[] = [];

      doc.on('update', (update) => {
        updates.push(fromUint8Array(update));
      });

      const attributes = JSON.parse(node.attributes) as LocalNodeAttributes;
      const updatedAttributes = updater(attributes);

      const attributesMap = doc.getMap('attributes');
      doc.transact(() => {
        applyCrdt(
          registryMap[updatedAttributes.type].schema,
          updatedAttributes,
          attributesMap,
        );
      });

      if (updates.length === 0) {
        return true;
      }

      const attributesJson = JSON.stringify(attributesMap.toJSON());
      const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

      const changeData: LocalUpdateNodeChangeData = {
        type: 'node_update',
        id: id,
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
            .where('id', '=', id)
            .where('version_id', '=', node.version_id)
            .execute();

          const hasChanges = hasUpdateChanges(result);

          if (hasChanges) {
            await trx
              .insertInto('changes')
              .values({
                data: JSON.stringify(changeData),
                created_at: updatedAt,
                retry_count: 0,
              })
              .execute();
          }

          return hasChanges;
        });

      if (result) {
        return true;
      }
    }
  }
}

export const nodeManager = new NodeManager();
