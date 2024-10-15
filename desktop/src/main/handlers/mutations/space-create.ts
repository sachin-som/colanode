import { databaseManager } from '@/main/data/database-manager';
import { generateId, IdType } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { SpaceCreateMutationInput } from '@/operations/mutations/space-create';
import * as Y from 'yjs';
import { NodeTypes } from '@/lib/constants';
import { fromUint8Array } from 'js-base64';

export class SpaceCreateMutationHandler
  implements MutationHandler<SpaceCreateMutationInput>
{
  async handleMutation(
    input: SpaceCreateMutationInput,
  ): Promise<MutationResult<SpaceCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const spaceId = generateId(IdType.Space);
    const spaceDoc = new Y.Doc({
      guid: spaceId,
    });

    const spaceAttributesMap = spaceDoc.getMap('attributes');
    spaceDoc.transact(() => {
      spaceAttributesMap.set('type', NodeTypes.Space);
      spaceAttributesMap.set('name', input.name);

      if (input.description) {
        spaceAttributesMap.set('description', input.description);
      }

      if (!spaceAttributesMap.has('collaborators')) {
        spaceAttributesMap.set('collaborators', new Y.Map<string>());
      }

      const collaboratorsMap = spaceAttributesMap.get(
        'collaborators',
      ) as Y.Map<string>;

      collaboratorsMap.set(input.userId, 'owner');
    });

    const spaceAttributes = JSON.stringify(spaceAttributesMap.toJSON());
    const spaceState = fromUint8Array(Y.encodeStateAsUpdate(spaceDoc));

    const pageId = generateId(IdType.Page);
    const pageIndex = generateNodeIndex(null, null);
    const pageDoc = new Y.Doc({
      guid: pageId,
    });

    const pageAttributesMap = pageDoc.getMap('attributes');
    pageDoc.transact(() => {
      pageAttributesMap.set('type', NodeTypes.Page);
      pageAttributesMap.set('name', 'Home');
      pageAttributesMap.set('parentId', spaceId);
      pageAttributesMap.set('index', pageIndex);
    });

    const pageAttributes = JSON.stringify(pageAttributesMap.toJSON());
    const pageState = fromUint8Array(Y.encodeStateAsUpdate(pageDoc));

    const channelId = generateId(IdType.Channel);
    const channelIndex = generateNodeIndex(pageIndex, null);
    const channelDoc = new Y.Doc({
      guid: channelId,
    });

    const channelAttributesMap = channelDoc.getMap('attributes');
    channelDoc.transact(() => {
      channelAttributesMap.set('type', NodeTypes.Channel);
      channelAttributesMap.set('name', 'Discussions');
      channelAttributesMap.set('parentId', spaceId);
      channelAttributesMap.set('index', channelIndex);
    });

    const channelAttributes = JSON.stringify(channelAttributesMap.toJSON());
    const channelState = fromUint8Array(Y.encodeStateAsUpdate(channelDoc));

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx
        .insertInto('nodes')
        .values([
          {
            id: spaceId,
            attributes: spaceAttributes,
            state: spaceState,
            created_at: new Date().toISOString(),
            created_by: input.userId,
            version_id: generateId(IdType.Version),
          },
          {
            id: pageId,
            attributes: pageAttributes,
            state: pageState,
            created_at: new Date().toISOString(),
            created_by: input.userId,
            version_id: generateId(IdType.Version),
          },
          {
            id: channelId,
            attributes: channelAttributes,
            state: channelState,
            created_at: new Date().toISOString(),
            created_by: input.userId,
            version_id: generateId(IdType.Version),
          },
        ])
        .execute();
    });

    return {
      output: {
        id: spaceId,
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
