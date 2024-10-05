import { databaseManager } from '@/main/data/database-manager';
import { NodeTypes } from '@/lib/constants';
import { generateId, IdType } from '@/lib/id';
import { buildCreateNode, generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { DatabaseCreateMutationInput } from '@/operations/mutations/database-create';

export class DatabaseCreateMutationHandler
  implements MutationHandler<DatabaseCreateMutationInput>
{
  async handleMutation(
    input: DatabaseCreateMutationInput,
  ): Promise<MutationResult<DatabaseCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

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

    const databaseId = generateId(IdType.Database);
    const tableViewId = generateId(IdType.TableView);
    const fieldId = generateId(IdType.Field);

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
