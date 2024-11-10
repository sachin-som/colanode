import { databaseManager } from '@/main/data/database-manager';
import { generateId, IdType } from '@colanode/core';
import { generateNodeIndex } from '@/lib/nodes';
import { MutationHandler, MutationResult } from '@/main/types';
import { ChannelCreateMutationInput } from '@/operations/mutations/channel-create';
import { ChannelAttributes } from '@colanode/core';
import { nodeManager } from '@/main/node-manager';

export class ChannelCreateMutationHandler
  implements MutationHandler<ChannelCreateMutationInput>
{
  async handleMutation(
    input: ChannelCreateMutationInput
  ): Promise<MutationResult<ChannelCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    const space = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', input.spaceId)
      .executeTakeFirst();

    if (!space) {
      throw new Error('Space not found');
    }

    const maxIndexResult = await workspaceDatabase
      .selectFrom('nodes')
      .select(['index'])
      .where('parent_id', '=', input.spaceId)
      .orderBy('index', 'desc')
      .limit(1)
      .executeTakeFirst();

    const maxIndex = maxIndexResult?.index ?? null;
    const id = generateId(IdType.Channel);

    const attributes: ChannelAttributes = {
      type: 'channel',
      name: input.name,
      parentId: input.spaceId,
      index: generateNodeIndex(maxIndex, null),
      collaborators: null,
    };

    await nodeManager.createNode(input.userId, { id, attributes });

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
        {
          type: 'workspace',
          table: 'changes',
          userId: input.userId,
        },
      ],
    };
  }
}
