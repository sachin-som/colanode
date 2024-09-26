import {
  Workspace,
  WorkspaceAccount,
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
import { fromUint8Array } from 'js-base64';

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
