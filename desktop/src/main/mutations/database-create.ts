import { databaseContext } from '@/main/data/database-context';
import { NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { buildCreateNode, generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { DatabaseCreateMutationInput } from '@/types/mutations/database-create';

export class DatabaseCreateMutationHandler
  implements MutationHandler<DatabaseCreateMutationInput>
{
  async handleMutation(
    input: DatabaseCreateMutationInput,
  ): Promise<MutationResult<DatabaseCreateMutationInput>> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    const siblings = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('parent_id', '=', input.spaceId)
      .execute();

    const maxIndex =
      siblings.length > 0
        ? siblings.sort((a, b) => compareString(a.index, b.index))[
            siblings.length - 1
          ].index
        : null;

    const databaseId = NeuronId.generate(NeuronId.Type.Database);
    const tableViewId = NeuronId.generate(NeuronId.Type.TableView);
    const fieldId = NeuronId.generate(NeuronId.Type.Field);

    await workspaceDatabase
      .insertInto('nodes')
      .values([
        buildCreateNode(
          {
            id: databaseId,
            attributes: {
              type: NodeTypes.Database,
              parentId: input.spaceId,
              index: generateNodeIndex(maxIndex, null),
              name: input.name,
            },
          },
          input.userId,
        ),
        buildCreateNode(
          {
            id: tableViewId,
            attributes: {
              type: NodeTypes.TableView,
              parentId: databaseId,
              index: generateNodeIndex(null, null),
              name: 'Default',
            },
          },
          input.userId,
        ),
        buildCreateNode(
          {
            id: fieldId,
            attributes: {
              type: NodeTypes.Field,
              parentId: databaseId,
              index: generateNodeIndex(null, null),
              name: 'Comment',
              dataType: 'text',
            },
          },
          input.userId,
        ),
      ])
      .execute();

    return {
      output: {
        id: databaseId,
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
