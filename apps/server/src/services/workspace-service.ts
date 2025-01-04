import {
  generateId,
  IdType,
  WorkspaceCreateInput,
  WorkspaceOutput,
  WorkspaceStatus,
  UserStatus,
} from '@colanode/core';

import { database } from '@/data/database';
import { SelectAccount } from '@/data/schema';
import { mapEntry } from '@/lib/entries';
import { entryService } from '@/services/entry-service';
import { eventBus } from '@/lib/event-bus';

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
      await entryService.createEntry({
        entryId: generateId(IdType.Page),
        rootId: spaceId,
        attributes: {
          type: 'page',
          name: 'Notes',
          parentId: spaceId,
        },
        userId: userId,
        workspaceId: workspaceId,
        ancestors: [spaceEntry],
      });

      await entryService.createEntry({
        entryId: generateId(IdType.Channel),
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
