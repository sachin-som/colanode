import { databaseContext } from '@/main/data/database-context';
import { NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { buildCreateNode, generateNodeIndex } from '@/lib/nodes';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { SelectOptionCreateMutationInput } from '@/types/mutations/select-option-create';

export class SelectOptionCreateMutationHandler
  implements MutationHandler<SelectOptionCreateMutationInput>
{
  async handleMutation(
    input: SelectOptionCreateMutationInput,
  ): Promise<MutationResult<SelectOptionCreateMutationInput>> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    const lastChild = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where((eb) =>
        eb.and([
          eb('parent_id', '=', input.fieldId),
          eb('type', '=', NodeTypes.SelectOption),
        ]),
      )
      .orderBy('index', 'desc')
      .limit(1)
      .executeTakeFirst();

    const maxIndex = lastChild?.index ? lastChild.index : null;
    const id = NeuronId.generate(NeuronId.Type.SelectOption);
    await workspaceDatabase
      .insertInto('nodes')
      .values(
        buildCreateNode(
          {
            id: id,
            attributes: {
              type: NodeTypes.SelectOption,
              parentId: input.fieldId,
              index: generateNodeIndex(maxIndex, null),
              name: input.name,
              color: input.color,
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
