import {
  Workspace,
  WorkspaceUser,
  WorkspaceAccountRoleUpdateInput,
  WorkspaceAccountsInviteInput,
  WorkspaceUserStatus,
  WorkspaceInput,
  WorkspaceOutput,
  WorkspaceRole,
  WorkspaceStatus,
} from '@/types/workspaces';
import { ApiError, NeuronRequest, NeuronResponse } from '@/types/api';
import { NeuronId } from '@/lib/id';
import { database } from '@/data/database';
import { Router } from 'express';
import * as Y from 'yjs';
import { fromUint8Array, toUint8Array } from 'js-base64';
import {
  CreateAccount,
  CreateNode,
  CreateWorkspaceUser,
  SelectNode,
  SelectWorkspaceUser,
} from '@/data/schema';
import { getNameFromEmail } from '@/lib/utils';
import { AccountStatus } from '@/types/accounts';
import { ServerNode } from '@/types/nodes';
import { mapNode } from '@/lib/nodes';

export const workspacesRouter = Router();

workspacesRouter.post('/', async (req: NeuronRequest, res: NeuronResponse) => {
  const input: WorkspaceInput = req.body;

  if (!req.accountId) {
    return res.status(401).json({
      code: ApiError.Unauthorized,
      message: 'Unauthorized.',
    });
  }

  if (!input.name) {
    return res.status(400).json({
      code: ApiError.MissingRequiredFields,
      message: 'Missing required fields.',
    });
  }

  const account = await database
    .selectFrom('accounts')
    .selectAll()
    .where('id', '=', req.accountId)
    .executeTakeFirst();

  if (!account) {
    return res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: 'Account not found.',
    });
  }

  const workspace: Workspace = {
    id: NeuronId.generate(NeuronId.Type.Workspace),
    name: input.name,
    description: input.description,
    avatar: input.avatar,
    createdAt: new Date(),
    createdBy: req.accountId,
    status: WorkspaceStatus.Active,
    versionId: NeuronId.generate(NeuronId.Type.Version),
  };

  const userId = NeuronId.generate(NeuronId.Type.User);
  const userVersionId = NeuronId.generate(NeuronId.Type.Version);
  const userDoc = new Y.Doc({
    guid: userId,
  });

  const userAttributesMap = userDoc.getMap('attributes');
  userDoc.transact(() => {
    userAttributesMap.set('type', 'user');
    userAttributesMap.set('name', account.name);
    userAttributesMap.set('avatar', account.avatar);
    userAttributesMap.set('email', account.email);
    userAttributesMap.set('role', WorkspaceRole.Owner);
    userAttributesMap.set('accountId', account.id);
  });

  const userAttributes = JSON.stringify(userAttributesMap.toJSON());
  const userState = fromUint8Array(Y.encodeStateAsUpdate(userDoc));

  const workspaceUser: WorkspaceUser = {
    id: userId,
    accountId: req.accountId,
    workspaceId: workspace.id,
    role: WorkspaceRole.Owner,
    createdAt: new Date(),
    createdBy: req.accountId,
    status: WorkspaceUserStatus.Active,
    versionId: NeuronId.generate(NeuronId.Type.Version),
  };

  await database.transaction().execute(async (trx) => {
    await trx
      .insertInto('workspaces')
      .values({
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        avatar: workspace.avatar,
        created_at: workspace.createdAt,
        created_by: workspace.createdBy,
        status: workspace.status,
        version_id: workspace.versionId,
      })
      .execute();

    await trx
      .insertInto('nodes')
      .values({
        id: userId,
        workspace_id: workspace.id,
        attributes: userAttributes,
        state: userState,
        created_at: workspaceUser.createdAt,
        created_by: workspaceUser.createdBy,
        version_id: userVersionId,
        server_created_at: new Date(),
      })
      .execute();

    await trx
      .insertInto('workspace_users')
      .values({
        id: workspaceUser.id,
        account_id: workspaceUser.accountId,
        workspace_id: workspaceUser.workspaceId,
        role: workspaceUser.role,
        created_at: workspaceUser.createdAt,
        created_by: workspaceUser.createdBy,
        status: workspaceUser.status,
        version_id: workspaceUser.versionId,
      })
      .execute();
  });

  const output: WorkspaceOutput = {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    avatar: workspace.avatar,
    versionId: workspace.versionId,
    accountId: account.id,
    role: workspaceUser.role,
    userId: userId,
  };

  return res.status(200).json(output);
});

workspacesRouter.put(
  '/:id',
  async (req: NeuronRequest, res: NeuronResponse) => {
    const id = req.params.id;
    const input: WorkspaceInput = req.body;

    if (!req.accountId) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', id)
      .where('account_id', '=', req.accountId)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    if (workspaceUser.role !== WorkspaceRole.Owner) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    if (workspaceUser.role !== WorkspaceRole.Owner) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const updatedWorkspace = await database
      .updateTable('workspaces')
      .set({
        name: input.name,
        description: input.description,
        avatar: input.avatar,
        updated_at: new Date(),
        updated_by: req.accountId,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedWorkspace) {
      return res.status(500).json({
        code: ApiError.InternalServerError,
        message: 'Internal server error.',
      });
    }

    const output: WorkspaceOutput = {
      id: updatedWorkspace.id,
      name: updatedWorkspace.name,
      description: updatedWorkspace.description,
      avatar: updatedWorkspace.avatar,
      versionId: updatedWorkspace.version_id,
      accountId: req.accountId,
      role: workspaceUser.role,
      userId: workspaceUser.id,
    };

    return res.status(200).json(output);
  },
);

workspacesRouter.delete(
  '/:id',
  async (req: NeuronRequest, res: NeuronResponse) => {
    const id = req.params.id;

    if (!req.accountId) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', id)
      .where('account_id', '=', req.accountId)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    if (workspaceUser.role !== WorkspaceRole.Owner) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    await database.deleteFrom('workspaces').where('id', '=', id).execute();

    return res.status(200).json({
      id: workspace.id,
    });
  },
);

workspacesRouter.get(
  '/:id',
  async (req: NeuronRequest, res: NeuronResponse) => {
    const id = req.params.id;

    if (!req.accountId) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', id)
      .where('account_id', '=', req.accountId)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const output: WorkspaceOutput = {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      avatar: workspace.avatar,
      versionId: workspace.version_id,
      accountId: req.accountId,
      role: workspaceUser.role,
      userId: workspaceUser.id,
    };

    return res.status(200).json(output);
  },
);

workspacesRouter.get('/', async (req: NeuronRequest, res: NeuronResponse) => {
  if (!req.accountId) {
    return res.status(401).json({
      code: ApiError.Unauthorized,
      message: 'Unauthorized.',
    });
  }

  const workspaceUsers = await database
    .selectFrom('workspace_users')
    .selectAll()
    .where('account_id', '=', req.accountId)
    .execute();

  const workspaceIds = workspaceUsers.map((wa) => wa.workspace_id);
  const workspaces = await database
    .selectFrom('workspaces')
    .selectAll()
    .where('id', 'in', workspaceIds)
    .execute();

  const outputs: WorkspaceOutput[] = [];

  for (const workspace of workspaces) {
    const workspaceAccount = workspaceUsers.find(
      (wa) => wa.workspace_id === workspace.id,
    );

    if (!workspaceAccount) {
      continue;
    }

    const output: WorkspaceOutput = {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      avatar: workspace.avatar,
      versionId: workspace.version_id,
      accountId: req.accountId,
      role: workspaceAccount.role,
      userId: workspaceAccount.id,
    };

    outputs.push(output);
  }

  return res.status(200).json(outputs);
});

workspacesRouter.post(
  '/:id/users',
  async (req: NeuronRequest, res: NeuronResponse) => {
    const id = req.params.id;
    const input: WorkspaceAccountsInviteInput = req.body;

    if (!input.emails || input.emails.length === 0) {
      return res.status(400).json({
        code: ApiError.BadRequest,
        message: 'BadRequest.',
      });
    }

    if (!req.accountId) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', id)
      .where('account_id', '=', req.accountId)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    if (
      workspaceUser.role !== WorkspaceRole.Owner &&
      workspaceUser.role !== WorkspaceRole.Admin
    ) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const existingAccounts = await database
      .selectFrom('accounts')
      .selectAll()
      .where('email', 'in', input.emails)
      .execute();

    let existingWorkspaceUsers: SelectWorkspaceUser[] = [];
    let existingUsers: SelectNode[] = [];
    if (existingAccounts.length > 0) {
      const existingAccountIds = existingAccounts.map((account) => account.id);
      existingWorkspaceUsers = await database
        .selectFrom('workspace_users')
        .selectAll()
        .where((eb) =>
          eb.and([
            eb('account_id', 'in', existingAccountIds),
            eb('workspace_id', '=', workspace.id),
          ]),
        )
        .execute();
    }

    if (existingWorkspaceUsers.length > 0) {
      const existingUserIds = existingWorkspaceUsers.map(
        (workspaceAccount) => workspaceAccount.id,
      );
      existingUsers = await database
        .selectFrom('nodes')
        .selectAll()
        .where('id', 'in', existingUserIds)
        .execute();
    }

    const accountsToCreate: CreateAccount[] = [];
    const workspaceUsersToCreate: CreateWorkspaceUser[] = [];
    const usersToCreate: CreateNode[] = [];

    const users: ServerNode[] = [];
    for (const email of input.emails) {
      let account = existingAccounts.find((account) => account.email === email);

      if (!account) {
        account = {
          id: NeuronId.generate(NeuronId.Type.Account),
          name: getNameFromEmail(email),
          email: email,
          avatar: null,
          attrs: null,
          password: null,
          status: AccountStatus.Pending,
          created_at: new Date(),
          updated_at: null,
        };

        accountsToCreate.push({
          id: account.id,
          email: account.email,
          name: account.name,
          status: account.status,
          created_at: account.created_at,
        });
      }

      const existingWorkspaceUser = existingWorkspaceUsers.find(
        (workspaceUser) => workspaceUser.account_id === account!.id,
      );

      if (existingWorkspaceUser) {
        const existingUser = existingUsers.find(
          (user) => user.id === existingWorkspaceUser.id,
        );
        if (!existingUser) {
          return res.status(500).json({
            code: ApiError.InternalServerError,
            message: 'Something went wrong.',
          });
        }

        users.push(mapNode(existingUser));
        continue;
      }

      const userId = NeuronId.generate(NeuronId.Type.User);
      const userVersionId = NeuronId.generate(NeuronId.Type.Version);
      const userDoc = new Y.Doc({
        guid: userId,
      });

      const userAttributesMap = userDoc.getMap('attributes');
      userDoc.transact(() => {
        userAttributesMap.set('type', 'user');
        userAttributesMap.set('name', account!.name);
        userAttributesMap.set('avatar', account!.avatar);
        userAttributesMap.set('email', account!.email);
        userAttributesMap.set('role', WorkspaceRole.Collaborator);
        userAttributesMap.set('accountId', account!.id);
      });

      const userAttributes = JSON.stringify(userAttributesMap.toJSON());
      const userState = fromUint8Array(Y.encodeStateAsUpdate(userDoc));

      workspaceUsersToCreate.push({
        id: userId,
        account_id: account!.id,
        workspace_id: workspace.id,
        role: WorkspaceRole.Collaborator,
        created_at: new Date(),
        created_by: req.accountId,
        status: WorkspaceUserStatus.Active,
        version_id: NeuronId.generate(NeuronId.Type.Version),
      });

      const user: ServerNode = {
        id: userId,
        type: 'user',
        attributes: JSON.parse(userAttributes),
        state: userState,
        createdAt: new Date(),
        createdBy: workspaceUser.id,
        serverCreatedAt: new Date(),
        versionId: userVersionId,
        workspaceId: workspace.id,
        index: null,
      };

      usersToCreate.push({
        id: user.id,
        attributes: userAttributes,
        state: userState,
        created_at: user.createdAt,
        created_by: user.createdBy,
        server_created_at: user.serverCreatedAt,
        version_id: user.versionId,
        workspace_id: user.workspaceId,
      });

      users.push(user);
    }

    if (
      accountsToCreate.length > 0 ||
      workspaceUsersToCreate.length > 0 ||
      usersToCreate.length > 0
    ) {
      await database.transaction().execute(async (trx) => {
        if (accountsToCreate.length > 0) {
          await trx.insertInto('accounts').values(accountsToCreate).execute();
        }

        if (workspaceUsersToCreate.length > 0) {
          await trx
            .insertInto('workspace_users')
            .values(workspaceUsersToCreate)
            .execute();
        }

        if (usersToCreate.length > 0) {
          await trx.insertInto('nodes').values(usersToCreate).execute();
        }
      });
    }

    return res.status(200).json({
      users: users,
    });
  },
);

workspacesRouter.put(
  '/:id/users/:userId',
  async (req: NeuronRequest, res: NeuronResponse) => {
    const id = req.params.id;
    const userId = req.params.userId;
    const input: WorkspaceAccountRoleUpdateInput = req.body;

    if (!req.accountId) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const currentWorkspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', id)
      .where('account_id', '=', req.accountId)
      .executeTakeFirst();

    if (!currentWorkspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    if (
      currentWorkspaceUser.role !== WorkspaceRole.Owner &&
      currentWorkspaceUser.role !== WorkspaceRole.Admin
    ) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const workspaceUserToUpdate = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!workspaceUserToUpdate) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'NotFound.',
      });
    }

    const user = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', workspaceUserToUpdate.id)
      .executeTakeFirst();

    if (!user) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'NotFound.',
      });
    }

    const userDoc = new Y.Doc({
      guid: user.id,
    });

    Y.applyUpdate(userDoc, toUint8Array(user.state));

    const userAttributesMap = userDoc.getMap('attributes');
    userAttributesMap.set('role', input.role);

    const userAttributes = JSON.stringify(userAttributesMap.toJSON());
    const encodedState = fromUint8Array(Y.encodeStateAsUpdate(userDoc));
    const updatedAt = new Date();

    const userNode: ServerNode = {
      id: user.id,
      type: user.type,
      workspaceId: user.workspace_id,
      index: null,
      parentId: null,
      attributes: JSON.parse(userAttributes),
      state: encodedState,
      createdAt: user.created_at,
      createdBy: user.created_by,
      serverCreatedAt: user.server_created_at,
      serverUpdatedAt: updatedAt,
      versionId: NeuronId.generate(NeuronId.Type.Version),
      updatedAt: updatedAt,
      updatedBy: currentWorkspaceUser.id,
    };

    await database.transaction().execute(async (trx) => {
      await database
        .updateTable('workspace_users')
        .set({
          role: input.role,
          updated_at: new Date(),
          updated_by: currentWorkspaceUser.account_id,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .where('id', '=', userId)
        .execute();

      await database
        .updateTable('nodes')
        .set({
          attributes: userAttributes,
          state: encodedState,
          server_updated_at: updatedAt,
          updated_at: updatedAt,
          updated_by: currentWorkspaceUser.id,
          version_id: userNode.versionId,
        })
        .where('id', '=', userNode.id)
        .execute();
    });

    return res.status(200).json({
      user: userNode,
    });
  },
);
