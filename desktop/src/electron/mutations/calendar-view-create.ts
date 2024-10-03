import { databaseContext } from '@/electron/database-context';
import { NodeTypes, ViewNodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { buildCreateNode, generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { CalendarViewCreateMutationInput } from '@/types/mutations/calendar-view-create';

export class CalendarViewCreateMutationHandler
  implements MutationHandler<CalendarViewCreateMutationInput>
{
  async handleMutation(
    input: CalendarViewCreateMutationInput,
  ): Promise<MutationResult<CalendarViewCreateMutationInput>> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

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

    const id = NeuronId.generate(NeuronId.Type.CalendarView);
    await workspaceDatabase
      .insertInto('nodes')
      .values(
        buildCreateNode(
          {
            id: id,
            attributes: {
              type: NodeTypes.CalendarView,
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
      changedTables: [
        {
          type: 'workspace',
          table: 'nodes',
          userId: input.userId,
        },
      ],
    };
  }
}
