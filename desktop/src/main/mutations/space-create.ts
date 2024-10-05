import { databaseManager } from '@/main/data/database-manager';
import { NodeTypes } from '@/lib/constants';
import { generateId, IdType } from '@/lib/id';
import { buildCreateNode, generateNodeIndex } from '@/lib/nodes';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { SpaceCreateMutationInput } from '@/types/mutations/space-create';

export class SpaceCreateMutationHandler
  implements MutationHandler<SpaceCreateMutationInput>
{
  async handleMutation(
    input: SpaceCreateMutationInput,
  ): Promise<MutationResult<SpaceCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const spaceId = generateId(IdType.Space);
    const pageId = generateId(IdType.Page);
    const channelId = generateId(IdType.Channel);

    const pageIndex = generateNodeIndex(null, null);
    const channelIndex = generateNodeIndex(pageIndex, null);

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx
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

      await trx
        .insertInto('node_collaborators')
        .values({
          node_id: spaceId,
          collaborator_id: input.userId,
          role: 'owner',
          created_at: new Date().toISOString(),
          created_by: input.userId,
          version_id: generateId(IdType.Version),
        })
        .execute();
    });

    return {
      output: {
        id: spaceId,
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
