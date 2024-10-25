import { databaseManager } from '@/main/data/database-manager';
import { generateId, IdType } from '@/lib/id';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { SpaceUpdateMutationInput } from '@/operations/mutations/space-update';
import * as Y from 'yjs';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { LocalNodeAttributes } from '@/types/nodes';
import { LocalUpdateNodeChangeData } from '@/types/sync';

export class SpaceUpdateMutationHandler
  implements MutationHandler<SpaceUpdateMutationInput>
{
  async handleMutation(
    input: SpaceUpdateMutationInput,
  ): Promise<MutationResult<SpaceUpdateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const space = await workspaceDatabase
      .selectFrom('nodes')
      .where('id', '=', input.id)
      .selectAll()
      .executeTakeFirst();

    if (!space) {
      return {
        output: {
          success: false,
        },
      };
    }

    const versionId = generateId(IdType.Version);
    const updatedAt = new Date().toISOString();
    const updates: string[] = [];

    const doc = new Y.Doc({
      guid: space.id,
    });
    Y.applyUpdate(doc, toUint8Array(space.state));

    doc.on('update', (update) => {
      updates.push(fromUint8Array(update));
    });

    const currentAttributes: LocalNodeAttributes = JSON.parse(space.attributes);
    const attributesMap = doc.getMap('attributes');
    doc.transact(() => {
      if (input.name !== currentAttributes.name) {
        attributesMap.set('name', input.name);
      }

      if (input.description !== currentAttributes.description) {
        attributesMap.set('description', input.description);
      }

      if (input.avatar !== currentAttributes.avatar) {
        attributesMap.set('avatar', input.avatar);
      }
    });

    const attributes = JSON.stringify(attributesMap.toJSON());
    const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

    const changeData: LocalUpdateNodeChangeData = {
      type: 'node_update',
      id: space.id,
      updatedAt: updatedAt,
      updatedBy: input.userId,
      versionId: versionId,
      updates: updates,
    };

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx
        .updateTable('nodes')
        .set({
          attributes: attributes,
          state: encodedState,
          updated_at: updatedAt,
          updated_by: input.userId,
          version_id: versionId,
        })
        .where('id', '=', input.id)
        .execute();

      await trx
        .insertInto('changes')
        .values({
          data: JSON.stringify(changeData),
          created_at: updatedAt,
        })
        .execute();
    });

    return {
      output: {
        success: true,
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
      ],
    };
  }
}
