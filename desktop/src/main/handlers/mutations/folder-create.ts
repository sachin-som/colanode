import { databaseManager } from '@/main/data/database-manager';
import { NodeTypes } from '@/lib/constants';
import { generateId, IdType } from '@/lib/id';
import { buildCreateNode, generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { FolderCreateMutationInput } from '@/operations/mutations/folder-create';

export class FolderCreateMutationHandler
  implements MutationHandler<FolderCreateMutationInput>
{
  async handleMutation(
    input: FolderCreateMutationInput,
  ): Promise<MutationResult<FolderCreateMutationInput>> {
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

    const id = generateId(IdType.Folder);
    await workspaceDatabase
      .insertInto('nodes')
      .values(
        buildCreateNode(
          {
            id: id,
            attributes: {
              type: NodeTypes.Folder,
              parentId: input.parentId,
              index: index,
              name: input.name,
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
