import { databaseContext } from '@/main/database-context';
import { NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { buildCreateNode, generateNodeIndex } from '@/lib/nodes';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { SpaceCreateMutationInput } from '@/types/mutations/space-create';

export class SpaceCreateMutationHandler
  implements MutationHandler<SpaceCreateMutationInput>
{
  async handleMutation(
    input: SpaceCreateMutationInput,
  ): Promise<MutationResult<SpaceCreateMutationInput>> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    const spaceId = NeuronId.generate(NeuronId.Type.Space);
    const pageId = NeuronId.generate(NeuronId.Type.Page);
    const channelId = NeuronId.generate(NeuronId.Type.Channel);

    const pageIndex = generateNodeIndex(null, null);
    const channelIndex = generateNodeIndex(pageIndex, null);

    await workspaceDatabase
      .insertInto('nodes')
      .values([
        buildCreateNode(
          {
            id: spaceId,
            attributes: {
              type: NodeTypes.Space,
              name: input.name,
              description: input.description,
            },
          },
          input.userId,
        ),
        buildCreateNode(
          {
            id: pageId,
            attributes: {
              type: NodeTypes.Page,
              parentId: spaceId,
              index: pageIndex,
              name: 'Home',
            },
          },
          input.userId,
        ),
        buildCreateNode(
          {
            id: channelId,
            attributes: {
              type: NodeTypes.Channel,
              parentId: spaceId,
              index: channelIndex,
              name: 'Discussions',
            },
          },
          input.userId,
        ),
      ])
      .execute();

    return {
      output: {
        id: spaceId,
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
