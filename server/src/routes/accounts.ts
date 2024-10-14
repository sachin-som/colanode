import { Request, Response, Router } from 'express';
import {
  AccountStatus,
  EmailLoginInput,
  EmailRegisterInput,
  GoogleLoginInput,
  GoogleUserInfo,
  LoginOutput,
} from '@/types/accounts';
import axios from 'axios';
import { ApiError, NeuronRequest, NeuronResponse } from '@/types/api';
import { generateId, IdType } from '@/lib/id';
import { database } from '@/data/database';
import bcrypt from 'bcrypt';
import { WorkspaceOutput, WorkspaceRole } from '@/types/workspaces';
import { authMiddleware } from '@/middlewares/auth';
import { generateToken } from '@/lib/tokens';
import { mapNode } from '@/lib/nodes';
import { enqueueAccountDeviceSync } from '@/queues/sync';

const GoogleUserInfoUrl = 'https://www.googleapis.com/oauth2/v1/userinfo';
const SaltRounds = 10;

export const accountsRouter = Router();

accountsRouter.post('/register/email', async (req: Request, res: Response) => {
  const input: EmailRegisterInput = req.body;
  const email = input.email.toLowerCase();

  let existingAccount = await database
    .selectFrom('accounts')
    .where('email', '=', email)
    .executeTakeFirst();

  if (existingAccount) {
    return res.status(400).json({
      code: ApiError.EmailAlreadyExists,
      message: 'Email already exists.',
    });
  }

  const salt = await bcrypt.genSalt(SaltRounds);
  const password = await bcrypt.hash(input.password, salt);
  const account = await database
    .insertInto('accounts')
    .values({
      id: generateId(IdType.Account),
      name: input.name,
      email: email,
      password: password,
      status: AccountStatus.Active,
      created_at: new Date(),
    })
    .returningAll()
    .executeTakeFirst();

  if (!account) {
    return res.status(500).json({
      code: ApiError.InternalServerError,
      message: 'Failed to create account.',
    });
  }

  const output = await buildLoginOutput(
    account.id,
    account.name,
    account.email,
  );

  return res.status(200).json(output);
});

accountsRouter.post('/login/email', async (req: Request, res: Response) => {
  const input: EmailLoginInput = req.body;
  const email = input.email.toLowerCase();

  let account = await database
    .selectFrom('accounts')
    .where('email', '=', email)
    .selectAll()
    .executeTakeFirst();

  if (!account) {
    return res.status(400).json({
      code: ApiError.EmailOrPasswordIncorrect,
      message: 'Invalid credentials.',
    });
  }

  if (account.status === AccountStatus.Pending) {
    return res.status(400).json({
      code: ApiError.UserPendingActivation,
      message: 'User is pending activation.',
    });
  }

  if (!account.password) {
    return res.status(400).json({
      code: ApiError.EmailOrPasswordIncorrect,
      message: 'Invalid credentials.',
    });
  }

  const passwordMatch = await bcrypt.compare(input.password, account.password);
  if (!passwordMatch) {
    return res.status(400).json({
      code: ApiError.EmailOrPasswordIncorrect,
      message: 'Invalid credentials.',
    });
  }

  const output = await buildLoginOutput(
    account.id,
    account.name,
    account.email,
  );
  return res.status(200).json(output);
});

accountsRouter.post('/login/google', async (req: Request, res: Response) => {
  const input: GoogleLoginInput = req.body;
  const url = `${GoogleUserInfoUrl}?access_token=${input.access_token}`;
  const userInfoResponse = await axios.get(url);

  if (userInfoResponse.status !== 200) {
    return res.status(400).json({
      code: ApiError.GoogleAuthFailed,
      message: 'Failed to authenticate with Google.',
    });
  }

  const googleUser: GoogleUserInfo = userInfoResponse.data;

  if (!googleUser) {
    return res.status(400).json({
      code: ApiError.GoogleAuthFailed,
      message: 'Failed to authenticate with Google.',
    });
  }

  let existingAccount = await database
    .selectFrom('accounts')
    .where('email', '=', googleUser.email)
    .selectAll()
    .executeTakeFirst();

  if (existingAccount) {
    if (existingAccount.status === AccountStatus.Pending) {
      return res.status(400).json({
        code: ApiError.UserPendingActivation,
        message: 'User is pending activation.',
      });
    }

    const attrs = existingAccount.attrs
      ? JSON.parse(existingAccount.attrs)
      : {};

    if (attrs?.googleId) {
      await database
        .updateTable('accounts')
        .set({
          attrs: JSON.stringify({ googleId: googleUser.id }),
          updated_at: new Date(),
        })
        .where('id', '=', existingAccount.id)
        .execute();
    }

    const output = await buildLoginOutput(
      existingAccount.id,
      existingAccount.name,
      existingAccount.email,
    );
    return res.status(200).json(output);
  }

  const newAccount = await database
    .insertInto('accounts')
    .values({
      id: generateId(IdType.Account),
      name: googleUser.name,
      email: googleUser.email,
      status: AccountStatus.Active,
      created_at: new Date(),
      password: null,
    })
    .returningAll()
    .executeTakeFirst();

  if (!newAccount) {
    return res.status(500).json({
      code: ApiError.InternalServerError,
      message: 'Failed to create account.',
    });
  }

  const output = await buildLoginOutput(
    newAccount.id,
    newAccount.name,
    newAccount.email,
  );
  return res.status(200).json(output);
});

accountsRouter.delete(
  '/logout',
  authMiddleware,
  async (req: NeuronRequest, res: NeuronResponse) => {
    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    await database
      .deleteFrom('account_devices')
      .where('id', '=', req.account.deviceId)
      .execute();

    return res.status(200).end();
  },
);

const buildLoginOutput = async (
  id: string,
  name: string,
  email: string,
): Promise<LoginOutput> => {
  const workspaceUsers = await database
    .selectFrom('workspace_users')
    .where('account_id', '=', id)
    .selectAll()
    .execute();

  const workspaceOutputs: WorkspaceOutput[] = [];
  if (workspaceUsers.length > 0) {
    const workspaceIds = workspaceUsers.map((wu) => wu.workspace_id);
    const workspaces = await database
      .selectFrom('workspaces')
      .where('id', 'in', workspaceIds)
      .selectAll()
      .execute();

    const userIds = workspaceUsers.map((wu) => wu.id);
    const userNodes = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', 'in', userIds)
      .execute();

    for (const workspaceUser of workspaceUsers) {
      const workspace = workspaces.find(
        (w) => w.id === workspaceUser.workspace_id,
      );

      if (!workspace) {
        continue;
      }

      const userNode = userNodes.find((n) => n.id === workspaceUser.id);
      if (!userNode) {
        continue;
      }

      workspaceOutputs.push({
        id: workspace.id,
        name: workspace.name,
        versionId: workspaceUser.version_id,
        avatar: workspace.avatar,
        description: workspace.description,
        user: {
          id: workspaceUser.id,
          accountId: workspaceUser.account_id,
          role: workspaceUser.role as WorkspaceRole,
          node: mapNode(userNode),
        },
      });
    }
  }

  const deviceId = generateId(IdType.Device);
  const { token, salt, hash } = generateToken(deviceId);

  const accountDevice = await database
    .insertInto('account_devices')
    .values({
      id: deviceId,
      account_id: id,
      token_hash: hash,
      token_salt: salt,
      token_generated_at: new Date(),
      type: 1,
      created_at: new Date(),
      version: '0.1.0',
    })
    .returningAll()
    .executeTakeFirst();

  if (!accountDevice) {
    throw new Error('Failed to create account device.');
  }

  await enqueueAccountDeviceSync(id, deviceId);

  return {
    account: {
      token,
      id,
      name,
      email,
      deviceId: accountDevice.id,
    },
    workspaces: workspaceOutputs,
  };
};
