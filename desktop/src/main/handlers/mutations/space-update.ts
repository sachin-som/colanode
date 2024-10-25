import { databaseManager } from '@/main/data/database-manager';
import { generateId, IdType } from '@/lib/id';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { SpaceUpdateMutationInput } from '@/operations/mutations/space-update';
import * as Y from 'yjs';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { LocalNodeAttributes } from '@/types/nodes';

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

    const spaceDoc = new Y.Doc({
      guid: space.id,
    });

    Y.applyUpdate(spaceDoc, toUint8Array(space.state));

    const attributes: LocalNodeAttributes = JSON.parse(space.attributes);
    const spaceAttributesMap = spaceDoc.getMap('attributes');
    spaceDoc.transact(() => {
      if (input.name !== attributes.name) {
        spaceAttributesMap.set('name', input.name);
      }

      if (input.description !== attributes.description) {
        spaceAttributesMap.set('description', input.description);
      }

      if (input.avatar !== attributes.avatar) {
        spaceAttributesMap.set('avatar', input.avatar);
      }
    });

    const spaceAttributes = JSON.stringify(spaceAttributesMap.toJSON());
    const spaceState = fromUint8Array(Y.encodeStateAsUpdate(spaceDoc));

    await workspaceDatabase
      .updateTable('nodes')
      .set({
        attributes: spaceAttributes,
        state: spaceState,
        updated_at: new Date().toISOString(),
        updated_by: input.userId,
        version_id: generateId(IdType.Version),
      })
      .where('id', '=', space.id)
      .execute();

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
      ],
    };
  }
}
