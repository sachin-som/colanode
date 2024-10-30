import * as Y from 'yjs';
import { databaseManager } from '@/main/data/database-manager';
import { NodeRole, NodeTypes } from '@/lib/constants';
import { generateId, IdType } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { PageCreateMutationInput } from '@/operations/mutations/page-create';
import { fromUint8Array } from 'js-base64';
import { LocalCreateNodeChangeData } from '@/types/sync';

export class PageCreateMutationHandler
  implements MutationHandler<PageCreateMutationInput>
{
  async handleMutation(
    input: PageCreateMutationInput,
  ): Promise<MutationResult<PageCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    let index: string | undefined = undefined;
    if (input.generateIndex) {
      const siblings = await workspaceDatabase
        .selectFrom('nodes')
        .selectAll()
        .where('parent_id', '=', input.parentId)
        .execute();

      const maxIndex =
        siblings.length > 0
          ? siblings.sort((a, b) => compareString(a.index, b.index))[
              siblings.length - 1
            ].index
          : null;

      index = generateNodeIndex(maxIndex, null);
    }

    const id = generateId(IdType.Page);
    const versionId = generateId(IdType.Version);
    const createdAt = new Date().toISOString();

    const doc = new Y.Doc({
      guid: id,
    });

    const attributesMap = doc.getMap('attributes');
    doc.transact(() => {
      attributesMap.set('type', NodeTypes.Page);
      attributesMap.set('parentId', input.parentId);
      attributesMap.set('index', index);
      attributesMap.set('name', input.name);
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
