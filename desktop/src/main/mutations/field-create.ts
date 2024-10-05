import { databaseManager } from '@/main/data/database-manager';
import { NodeTypes } from '@/lib/constants';
import { generateId, IdType } from '@/lib/id';
import { buildCreateNode, generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { FieldCreateMutationInput } from '@/types/mutations/field-create';

export class FieldCreateMutationHandler
  implements MutationHandler<FieldCreateMutationInput>
{
  async handleMutation(
    input: FieldCreateMutationInput,
  ): Promise<MutationResult<FieldCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const siblings = await workspaceDatabase
      .selectFrom('nodes')
      .where((eb) =>
        eb.and({
          parent_id: input.databaseId,
          type: NodeTypes.Field,
        }),
      )
      .selectAll()
      .execute();

    const maxIndex =
      siblings.length > 0
        ? siblings.sort((a, b) => compareString(a.index, b.index))[
            siblings.length - 1
          ].index
        : null;

    const id = generateId(IdType.Field);
    await workspaceDatabase
      .insertInto('nodes')
      .values(
        buildCreateNode(
          {
            id: id,
            attributes: {
              type: NodeTypes.Field,
              parentId: input.databaseId,
              index: generateNodeIndex(maxIndex, null),
              name: input.name,
              dataType: input.dataType,
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
