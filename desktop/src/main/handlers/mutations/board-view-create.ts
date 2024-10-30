import * as Y from 'yjs';
import { databaseManager } from '@/main/data/database-manager';
import { NodeRole, NodeTypes, ViewNodeTypes } from '@/lib/constants';
import { generateId, IdType } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { BoardViewCreateMutationInput } from '@/operations/mutations/board-view-create';
import { fromUint8Array } from 'js-base64';
import { LocalCreateNodeChangeData } from '@/types/sync';

export class BoardViewCreateMutationHandler
  implements MutationHandler<BoardViewCreateMutationInput>
{
  async handleMutation(
    input: BoardViewCreateMutationInput,
  ): Promise<MutationResult<BoardViewCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const siblings = await workspaceDatabase
      .selectFrom('nodes')
      .where((eb) =>
        eb.and([
          eb('parent_id', '=', input.databaseId),
          eb('type', 'in', ViewNodeTypes),
        ]),
      )
      .selectAll()
      .execute();

    const maxIndex =
      siblings.length > 0
        ? siblings.sort((a, b) => compareString(a.index, b.index))[
            siblings.length - 1
          ].index
        : null;

    const id = generateId(IdType.BoardView);
    const versionId = generateId(IdType.Version);
    const createdAt = new Date().toISOString();

    const doc = new Y.Doc({
      guid: id,
    });

    const attributesMap = doc.getMap('attributes');
    doc.transact(() => {
      attributesMap.set('type', NodeTypes.BoardView);
      attributesMap.set('parentId', input.databaseId);
      attributesMap.set('index', generateNodeIndex(maxIndex, null));
      attributesMap.set('name', input.name);
      attributesMap.set('groupBy', input.groupBy);

      const collaboratorsMap = new Y.Map<string>();
      collaboratorsMap.set(input.userId, NodeRole.Owner);
      attributesMap.set('collaborators', collaboratorsMap);
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
      ],
    };
  }
}
