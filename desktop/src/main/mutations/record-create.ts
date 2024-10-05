import { databaseManager } from '@/main/data/database-manager';
import { NodeTypes } from '@/lib/constants';
import { generateId, IdType } from '@/lib/id';
import { buildCreateNode, generateNodeIndex } from '@/lib/nodes';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { RecordCreateMutationInput } from '@/types/mutations/record-create';

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
    await workspaceDatabase
      .insertInto('nodes')
      .values(
        buildCreateNode(
          {
            id: id,
            attributes: {
              type: NodeTypes.Record,
              parentId: input.databaseId,
              index: generateNodeIndex(maxIndex, null),
            },
          },
          input.userId,
        ),
      )
      .execute();

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
