import { databaseManager } from '@/main/data/database-manager';
import { generateId, IdType } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { SpaceCreateMutationInput } from '@/operations/mutations/space-create';
import * as Y from 'yjs';
import { NodeRole, NodeTypes } from '@/lib/constants';
import { fromUint8Array } from 'js-base64';
import { LocalCreateNodeChangeData } from '@/types/sync';

export class SpaceCreateMutationHandler
  implements MutationHandler<SpaceCreateMutationInput>
{
  async handleMutation(
    input: SpaceCreateMutationInput,
  ): Promise<MutationResult<SpaceCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const createdAt = new Date().toISOString();

    const spaceId = generateId(IdType.Space);
    const spaceVersionId = generateId(IdType.Version);
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

      const collaboratorsMap = new Y.Map<string>();
      spaceAttributesMap.set('collaborators', collaboratorsMap);

      collaboratorsMap.set(input.userId, NodeRole.Owner);
    });

    const spaceAttributes = JSON.stringify(spaceAttributesMap.toJSON());
    const spaceState = fromUint8Array(Y.encodeStateAsUpdate(spaceDoc));

    const spaceChangeData: LocalCreateNodeChangeData = {
      type: 'node_create',
      id: spaceId,
      state: spaceState,
      createdAt: createdAt,
      createdBy: input.userId,
      versionId: spaceVersionId,
    };

    const pageId = generateId(IdType.Page);
    const pageIndex = generateNodeIndex(null, null);
    const pageVersionId = generateId(IdType.Version);
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

    const pageChangeData: LocalCreateNodeChangeData = {
      type: 'node_create',
      id: pageId,
      state: pageState,
      createdAt: createdAt,
      createdBy: input.userId,
      versionId: pageVersionId,
    };

    const channelId = generateId(IdType.Channel);
    const channelIndex = generateNodeIndex(pageIndex, null);
    const channelVersionId = generateId(IdType.Version);
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

    const channelChangeData: LocalCreateNodeChangeData = {
      type: 'node_create',
      id: channelId,
      state: channelState,
      createdAt: createdAt,
      createdBy: input.userId,
      versionId: channelVersionId,
    };

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
            version_id: spaceVersionId,
          },
          {
            id: pageId,
            attributes: pageAttributes,
            state: pageState,
            created_at: new Date().toISOString(),
            created_by: input.userId,
            version_id: pageVersionId,
          },
          {
            id: channelId,
            attributes: channelAttributes,
            state: channelState,
            created_at: new Date().toISOString(),
            created_by: input.userId,
            version_id: channelVersionId,
          },
        ])
        .execute();

      await trx
        .insertInto('changes')
        .values([
          {
            data: JSON.stringify(spaceChangeData),
            created_at: createdAt,
          },
          {
            data: JSON.stringify(pageChangeData),
            created_at: createdAt,
          },
          {
            data: JSON.stringify(channelChangeData),
            created_at: createdAt,
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
        {
          type: 'workspace',
          table: 'changes',
          userId: input.userId,
        },
      ],
    };
  }
}
