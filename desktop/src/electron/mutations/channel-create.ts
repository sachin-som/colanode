import { databaseContext } from '@/electron/database-context';
import { NodeTypes, ViewNodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { buildCreateNode, generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { ChannelCreateMutationInput } from '@/types/mutations/channel-create';

export class ChannelCreateMutationHandler
  implements MutationHandler<ChannelCreateMutationInput>
{
  async handleMutation(
    input: ChannelCreateMutationInput,
  ): Promise<MutationResult<ChannelCreateMutationInput>> {
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

    const id = NeuronId.generate(NeuronId.Type.Channel);
    await workspaceDatabase
      .insertInto('nodes')
      .values(
        buildCreateNode(
          {
            id: id,
            attributes: {
              type: NodeTypes.Channel,
              parentId: input.spaceId,
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
