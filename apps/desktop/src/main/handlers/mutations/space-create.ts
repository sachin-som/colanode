import { databaseManager } from '@/main/data/database-manager';
import { generateId, IdType, NodeRoles } from '@colanode/core';
import { generateNodeIndex } from '@/lib/nodes';
import { MutationHandler, MutationResult } from '@/main/types';
import { SpaceCreateMutationInput } from '@/operations/mutations/space-create';
import {
  ChannelAttributes,
  PageAttributes,
  SpaceAttributes,
} from '@colanode/core';
import { nodeManager } from '@/main/node-manager';

export class SpaceCreateMutationHandler
  implements MutationHandler<SpaceCreateMutationInput>
{
  async handleMutation(
    input: SpaceCreateMutationInput
  ): Promise<MutationResult<SpaceCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    const spaceId = generateId(IdType.Space);
    const spaceAttributes: SpaceAttributes = {
      type: 'space',
      name: input.name,
      collaborators: {
        [input.userId]: NodeRoles.Admin,
      },
      parentId: input.workspaceId,
      description: input.description,
      avatar: null,
    };

    const pageId = generateId(IdType.Page);
    const pageAttributes: PageAttributes = {
      type: 'page',
      name: 'Home',
      parentId: spaceId,
      content: {},
      collaborators: {},
    };

    const channelId = generateId(IdType.Channel);
    const channelAttributes: ChannelAttributes = {
      type: 'channel',
      name: 'Discussions',
      parentId: spaceId,
      index: generateNodeIndex(null, null),
    };

    await workspaceDatabase.transaction().execute(async (trx) => {
      await nodeManager.createNode(trx, input.userId, spaceId, spaceAttributes);
      await nodeManager.createNode(trx, input.userId, pageId, pageAttributes);
      await nodeManager.createNode(
        trx,
        input.userId,
        channelId,
        channelAttributes
      );
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
        {
          type: 'workspace',
          table: 'changes',
          userId: input.userId,
        },
      ],
    };
  }
}
