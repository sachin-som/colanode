import {
  generateId,
  IdType,
  WorkspaceCreateInput,
  WorkspaceOutput,
  WorkspaceStatus,
  UserStatus,
  MessageType,
} from '@colanode/core';

import { database } from '@/data/database';
import { SelectAccount } from '@/data/schema';
import { mapEntry } from '@/lib/entries';
import { entryService } from '@/services/entry-service';
import { eventBus } from '@/lib/event-bus';
import { configuration } from '@/lib/configuration';
import { messageService } from '@/services/message-service';
import {
  generateWelcomePageBlocks,
  generateInitialMessageBlocks,
} from '@/lib/blocks';

class WorkspaceService {
  public async createWorkspace(
    account: SelectAccount,
    input: WorkspaceCreateInput
  ): Promise<WorkspaceOutput> {
    const date = new Date();
    const workspaceId = generateId(IdType.Workspace);
    const userId = generateId(IdType.User);
    const spaceId = generateId(IdType.Space);

    const workspace = await database
      .insertInto('workspaces')
      .values({
        id: workspaceId,
        name: input.name,
        description: input.description,
        avatar: input.avatar,
        created_at: date,
        created_by: account.id,
        status: WorkspaceStatus.Active,
      })
      .returningAll()
      .executeTakeFirst();

    if (!workspace) {
      throw new Error('Failed to create workspace.');
    }

    const user = await database
      .insertInto('users')
      .values({
        id: userId,
        account_id: account.id,
        workspace_id: workspaceId,
        role: 'owner',
        name: account.name,
        email: account.email,
        avatar: account.avatar,
        storage_limit: configuration.user.storageLimit,
        max_file_size: configuration.user.maxFileSize,
        created_at: date,
        created_by: account.id,
        status: UserStatus.Active,
      })
      .returningAll()
      .executeTakeFirst();

    if (!user) {
      throw new Error('Failed to create workspace user.');
    }

    const createSpaceEntryOutput = await entryService.createEntry({
      entryId: spaceId,
      rootId: spaceId,
      attributes: {
        type: 'space',
        name: 'Home',
        description: 'This is your home space.',
        visibility: 'private',
        collaborators: {
          [userId]: 'admin',
        },
      },
      userId: userId,
      workspaceId: workspaceId,
      ancestors: [],
    });

    if (createSpaceEntryOutput) {
      const spaceEntry = mapEntry(createSpaceEntryOutput.entry);

      const pageId = generateId(IdType.Page);
      await entryService.createEntry({
        entryId: pageId,
        rootId: spaceId,
        attributes: {
          type: 'page',
          name: 'Welcome',
          parentId: spaceId,
          content: generateWelcomePageBlocks(pageId),
        },
        userId: userId,
        workspaceId: workspaceId,
        ancestors: [spaceEntry],
      });

      const channelId = generateId(IdType.Channel);
      await entryService.createEntry({
        entryId: channelId,
        rootId: spaceId,
        attributes: {
          type: 'channel',
          name: 'Discussions',
          parentId: spaceId,
        },
        userId: userId,
        workspaceId: workspaceId,
        ancestors: [spaceEntry],
      });

      const messageId = generateId(IdType.Message);
      await messageService.createMessage(user, {
        id: messageId,
        type: 'create_message',
        data: {
          id: messageId,
          entryId: channelId,
          parentId: channelId,
          attributes: {
            type: MessageType.Standard,
            blocks: generateInitialMessageBlocks(messageId),
          },
          rootId: spaceId,
          createdAt: date.toISOString(),
        },
        createdAt: date.toISOString(),
      });
    }

    eventBus.publish({
      type: 'workspace_created',
      workspaceId: workspaceId,
    });

    eventBus.publish({
      type: 'user_created',
      userId: userId,
      workspaceId: workspaceId,
      accountId: account.id,
    });

    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      avatar: workspace.avatar,
      user: {
        id: user.id,
        accountId: user.account_id,
        role: user.role,
        storageLimit: user.storage_limit,
        maxFileSize: user.max_file_size,
      },
    };
  }

  public async createDefaultWorkspace(account: SelectAccount) {
    const input: WorkspaceCreateInput = {
      name: `${account.name}'s Workspace`,
      description: 'This is your personal workspace.',
      avatar: '',
    };

    return this.createWorkspace(account, input);
  }
}

export const workspaceService = new WorkspaceService();
