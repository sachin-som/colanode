import * as Y from 'yjs';
import { databaseManager } from '@/main/data/database-manager';
import { NodeRole, NodeTypes } from '@/lib/constants';
import { generateId, IdType } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { RecordCreateMutationInput } from '@/operations/mutations/record-create';
import { fromUint8Array } from 'js-base64';
import { LocalCreateNodeChangeData } from '@/types/sync';

export class RecordCreateMutationHandler
  implements MutationHandler<RecordCreateMutationInput>
{
  async handleMutation(
    input: RecordCreateMutationInput,
  ): Promise<MutationResult<RecordCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const lastChild = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where((eb) =>
        eb.and([
          eb('parent_id', '=', input.databaseId),
          eb('type', '=', NodeTypes.Record),
        ]),
      )
      .orderBy('index', 'desc')
      .limit(1)
      .executeTakeFirst();

    const maxIndex = lastChild?.index ? lastChild.index : null;

    const id = generateId(IdType.Record);
    const versionId = generateId(IdType.Version);
    const createdAt = new Date().toISOString();

    const doc = new Y.Doc({
      guid: id,
    });

    const attributesMap = doc.getMap('attributes');
    doc.transact(() => {
      attributesMap.set('type', NodeTypes.Record);
      attributesMap.set('parentId', input.databaseId);
      attributesMap.set('index', generateNodeIndex(maxIndex, null));

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
        {
          type: 'workspace',
          table: 'changes',
          userId: input.userId,
        },
      ],
    };
  }
}
