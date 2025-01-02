import {
  ChannelAttributes,
  generateId,
  IdType,
  PageAttributes,
  SpaceAttributes,
} from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  SpaceCreateMutationInput,
  SpaceCreateMutationOutput,
} from '@/shared/mutations/spaces/space-create';
import { MutationError, MutationErrorCode } from '@/shared/mutations';

export class SpaceCreateMutationHandler
  implements MutationHandler<SpaceCreateMutationInput>
{
  async handleMutation(
    input: SpaceCreateMutationInput
  ): Promise<SpaceCreateMutationOutput> {
    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .where('user_id', '=', input.userId)
      .selectAll()
      .executeTakeFirst();

    if (!workspace) {
      throw new MutationError(
        MutationErrorCode.WorkspaceNotFound,
        'Workspace was not found or has been deleted.'
      );
    }

    if (workspace.role === 'guest' || workspace.role === 'none') {
      throw new MutationError(
        MutationErrorCode.SpaceCreateForbidden,
        "You don't have permission to create spaces in this workspace."
      );
    }

    const spaceId = generateId(IdType.Space);
    const spaceAttributes: SpaceAttributes = {
      type: 'space',
      name: input.name,
      collaborators: {
        [input.userId]: 'admin',
      },
      description: input.description,
      avatar: null,
    };

    await entryService.createEntry(input.userId, {
      id: spaceId,
      attributes: spaceAttributes,
      parentId: null,
    });

    const pageId = generateId(IdType.Page);
    const pageAttributes: PageAttributes = {
      type: 'page',
      name: 'Home',
      parentId: spaceId,
      content: {},
      collaborators: {},
    };

    await entryService.createEntry(input.userId, {
      id: pageId,
      attributes: pageAttributes,
      parentId: spaceId,
    });

    const channelId = generateId(IdType.Channel);
    const channelAttributes: ChannelAttributes = {
      type: 'channel',
      name: 'Discussions',
      parentId: spaceId,
    };

    await entryService.createEntry(input.userId, {
      id: channelId,
      attributes: channelAttributes,
      parentId: spaceId,
    });

    return {
      id: spaceId,
    };
  }
}
