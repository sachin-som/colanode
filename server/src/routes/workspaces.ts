import {
  Workspace,
  WorkspaceAccount,
  WorkspaceAccountRoleUpdateInput,
  WorkspaceAccountsInviteInput,
  WorkspaceAccountStatus,
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
  CreateWorkspaceAccount,
  SelectNode,
  SelectWorkspaceAccount,
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

  const workspaceAccount: WorkspaceAccount = {
    accountId: req.accountId,
    workspaceId: workspace.id,
    userId: userId,
    role: WorkspaceRole.Owner,
    createdAt: new Date(),
    createdBy: req.accountId,
    status: WorkspaceAccountStatus.Active,
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
        created_at: workspaceAccount.createdAt,
        created_by: workspaceAccount.createdBy,
        version_id: userVersionId,
        server_created_at: new Date(),
      })
      .execute();

    await trx
      .insertInto('workspace_accounts')
      .values({
        account_id: workspaceAccount.accountId,
        workspace_id: workspaceAccount.workspaceId,
        user_id: workspaceAccount.userId,
        role: workspaceAccount.role,
        created_at: workspaceAccount.createdAt,
        created_by: workspaceAccount.createdBy,
        status: workspaceAccount.status,
        version_id: workspaceAccount.versionId,
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
    role: workspaceAccount.role,
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

    const workspaceAccount = await database
      .selectFrom('workspace_accounts')
      .selectAll()
      .where('workspace_id', '=', id)
      .where('account_id', '=', req.accountId)
      .executeTakeFirst();

    if (!workspaceAccount) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    if (workspaceAccount.role !== WorkspaceRole.Owner) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    if (!workspaceAccount) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    if (workspaceAccount.role !== WorkspaceRole.Owner) {
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
      role: workspaceAccount.role,
      userId: workspaceAccount.user_id,
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

    const workspaceAccount = await database
      .selectFrom('workspace_accounts')
      .selectAll()
      .where('workspace_id', '=', id)
      .where('account_id', '=', req.accountId)
      .executeTakeFirst();

    if (!workspaceAccount) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    if (workspaceAccount.role !== WorkspaceRole.Owner) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    await database.deleteFrom('workspaces').where('id', '=', id).execute();

    await database.deleteFrom('workspaces').where('id', '=', id).execute();

    return res.status(200).json({
      id: workspace.id,
    });
  },
);

workspacesRouter.get(':id', async (req: NeuronRequest, res: NeuronResponse) => {
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

  const workspaceAccount = await database
    .selectFrom('workspace_accounts')
    .selectAll()
    .where('workspace_id', '=', id)
    .where('account_id', '=', req.accountId)
    .executeTakeFirst();

  if (!workspaceAccount) {
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
    role: workspaceAccount.role,
    userId: workspaceAccount.user_id,
  };

  return res.status(200).json(output);
});

workspacesRouter.get('/', async (req: NeuronRequest, res: NeuronResponse) => {
  if (!req.accountId) {
    return res.status(401).json({
      code: ApiError.Unauthorized,
      message: 'Unauthorized.',
    });
  }

  const workspaceAccounts = await database
    .selectFrom('workspace_accounts')
    .selectAll()
    .where('account_id', '=', req.accountId)
    .execute();

  const workspaceIds = workspaceAccounts.map((wa) => wa.workspace_id);
  const workspaces = await database
    .selectFrom('workspaces')
    .selectAll()
    .where('id', 'in', workspaceIds)
    .execute();

  const outputs: WorkspaceOutput[] = [];

  for (const workspace of workspaces) {
    const workspaceAccount = workspaceAccounts.find(
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
      userId: workspaceAccount.user_id,
    };

    outputs.push(output);
  }

  return res.status(200).json(outputs);
});

workspacesRouter.post(
  '/:id/accounts',
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

    const workspaceAccount = await database
      .selectFrom('workspace_accounts')
      .selectAll()
      .where('workspace_id', '=', id)
      .where('account_id', '=', req.accountId)
      .executeTakeFirst();

    if (!workspaceAccount) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    if (
      workspaceAccount.role !== WorkspaceRole.Owner &&
      workspaceAccount.role !== WorkspaceRole.Admin
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

    let existingWorkspaceAccounts: SelectWorkspaceAccount[] = [];
    let existingUsers: SelectNode[] = [];
    if (existingAccounts.length > 0) {
      const existingAccountIds = existingAccounts.map((account) => account.id);
      existingWorkspaceAccounts = await database
        .selectFrom('workspace_accounts')
        .selectAll()
        .where((eb) =>
          eb.and([
            eb('account_id', 'in', existingAccountIds),
            eb('workspace_id', '=', workspace.id),
          ]),
        )
        .execute();
    }

    if (existingWorkspaceAccounts.length > 0) {
      const existingUserIds = existingWorkspaceAccounts.map(
        (workspaceAccount) => workspaceAccount.user_id,
      );
      existingUsers = await database
        .selectFrom('nodes')
        .selectAll()
        .where('id', 'in', existingUserIds)
        .execute();
    }

    const accountsToCreate: CreateAccount[] = [];
    const workspaceAccountsToCreate: CreateWorkspaceAccount[] = [];
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

      const existingWorkspaceAccount = existingWorkspaceAccounts.find(
        (workspaceAccount) => workspaceAccount.account_id === account!.id,
      );

      if (existingWorkspaceAccount) {
        const existingUser = existingUsers.find(
          (user) => user.id === existingWorkspaceAccount.user_id,
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

      workspaceAccountsToCreate.push({
        account_id: account!.id,
        workspace_id: workspace.id,
        user_id: userId,
        role: WorkspaceRole.Collaborator,
        created_at: new Date(),
        created_by: req.accountId,
        status: WorkspaceAccountStatus.Active,
        version_id: NeuronId.generate(NeuronId.Type.Version),
      });

      const user: ServerNode = {
        id: userId,
        type: 'user',
        attributes: JSON.parse(userAttributes),
        state: userState,
        createdAt: new Date(),
        createdBy: workspaceAccount.user_id,
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
      workspaceAccountsToCreate.length > 0 ||
      usersToCreate.length > 0
    ) {
      await database.transaction().execute(async (trx) => {
        if (accountsToCreate.length > 0) {
          await trx.insertInto('accounts').values(accountsToCreate).execute();
        }

        if (workspaceAccountsToCreate.length > 0) {
          await trx
            .insertInto('workspace_accounts')
            .values(workspaceAccountsToCreate)
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
  '/:id/accounts/:accountId',
  async (req: NeuronRequest, res: NeuronResponse) => {
    const id = req.params.id;
    const accountId = req.params.accountId;
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

    const workspaceAccounts = await database
      .selectFrom('workspace_accounts')
      .selectAll()
      .where('workspace_id', '=', id)
      .where('account_id', 'in', [req.accountId, accountId])
      .execute();

    const currentWorkspaceAccount = workspaceAccounts.find(
      (workspaceAccount) => workspaceAccount.account_id === req.accountId,
    );

    if (!currentWorkspaceAccount) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    if (
      currentWorkspaceAccount.role !== WorkspaceRole.Owner &&
      currentWorkspaceAccount.role !== WorkspaceRole.Admin
    ) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const workspaceAccountToUpdate = workspaceAccounts.find(
      (workspaceAccount) => workspaceAccount.account_id === accountId,
    );

    if (!workspaceAccountToUpdate) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'NotFound.',
      });
    }

    const user = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', workspaceAccountToUpdate.user_id)
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
      updatedBy: currentWorkspaceAccount.user_id,
    };

    await database.transaction().execute(async (trx) => {
      await database
        .updateTable('workspace_accounts')
        .set({
          role: input.role,
          updated_at: new Date(),
          updated_by: currentWorkspaceAccount.account_id,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .execute();

      await database
        .updateTable('nodes')
        .set({
          attributes: userAttributes,
          state: encodedState,
          server_updated_at: updatedAt,
          updated_at: updatedAt,
          updated_by: currentWorkspaceAccount.user_id,
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
