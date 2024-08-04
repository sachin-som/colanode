import { Request, Response } from 'express';
import {
  AccountStatus,
  EmailLoginInput,
  EmailRegisterInput,
  GoogleLoginInput,
  GoogleUserInfo,
  LoginOutput,
} from '@/types/accounts';
import axios from 'axios';
import { ApiError } from '@/types/api';
import { generateId, IdType } from '@/lib/id';
import jwt from 'jsonwebtoken';
import { prisma } from '@/data/db';
import bcrypt from 'bcrypt';
import { WorkspaceOutput } from '@/types/workspaces';

const GoogleUserInfoUrl = 'https://www.googleapis.com/oauth2/v1/userinfo';
const JwtSecretKey = process.env.JWT_SECRET ?? '';
const JwtAudience = process.env.JWT_AUDIENCE ?? '';
const JwtIssuer = process.env.JWT_ISSUER ?? '';
const SaltRounds = 10;

const buildLoginOutput = async (
  id: string,
  name: string,
  email: string,
): Promise<LoginOutput> => {
  const signOptions: jwt.SignOptions = {
    issuer: JwtIssuer,
    audience: JwtAudience,
    subject: id,
    expiresIn: '1y',
  };

  const payload = {
    name: name,
    email: email,
  };

  const token = jwt.sign(payload, JwtSecretKey, signOptions);

  const accountWorkspaces = await prisma.workspaceAccounts.findMany({
    where: {
      accountId: id,
    },
  });

  const workspaceIds = accountWorkspaces.map((wa) => wa.workspaceId);
  const workspaces = await prisma.workspaces.findMany({
    where: {
      id: {
        in: workspaceIds,
      },
    },
  });

  const workspaceOutputs: WorkspaceOutput[] = [];
  for (const accountWorkspace of accountWorkspaces) {
    const workspace = workspaces.find(
      (w) => w.id === accountWorkspace.workspaceId,
    );
    if (!workspace) {
      continue;
    }

    workspaceOutputs.push({
      id: workspace.id,
      name: workspace.name,
      role: accountWorkspace.role,
      userNodeId: accountWorkspace.userNodeId,
      versionId: accountWorkspace.versionId,
      accountId: accountWorkspace.accountId,
      avatar: workspace.avatar,
      description: workspace.description,
    });
  }

  return {
    account: {
      token,
      id,
      name,
      email,
    },
    workspaces: workspaceOutputs,
  };
};

const registerWithEmail = async (req: Request, res: Response) => {
  const input: EmailRegisterInput = req.body;
  let existingAccount = await prisma.accounts.findUnique({
    where: {
      email: input.email,
    },
  });

  if (existingAccount) {
    return res.status(400).json({
      code: ApiError.EmailAlreadyExists,
      message: 'Email already exists.',
    });
  }

  const salt = await bcrypt.genSalt(SaltRounds);
  const password = await bcrypt.hash(input.password, salt);
  const account = await prisma.accounts.create({
    data: {
      id: generateId(IdType.Account),
      name: input.name,
      email: input.email,
      password: password,
      status: AccountStatus.Active,
      createdAt: new Date(),
    },
  });

  const output = await buildLoginOutput(
    account.id,
    account.name,
    account.email,
  );

  return res.status(200).json(output);
};

const loginWithEmail = async (req: Request, res: Response) => {
  const input: EmailLoginInput = req.body;
  let account = await prisma.accounts.findUnique({
    where: {
      email: input.email,
    },
  });

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
};

const loginWithGoogle = async (req: Request, res: Response) => {
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

  let existingAccount = await prisma.accounts.findUnique({
    where: {
      email: googleUser.email,
    },
  });

  if (existingAccount) {
    if (existingAccount.status === AccountStatus.Pending) {
      return res.status(400).json({
        code: ApiError.UserPendingActivation,
        message: 'User is pending activation.',
      });
    }

    const attrs = (existingAccount.attrs as Record<string, any>) ?? {};
    if (attrs?.googleId) {
      await prisma.accounts.update({
        where: {
          id: existingAccount.id,
        },
        data: {
          attrs: { googleId: googleUser.id },
          updatedAt: new Date(),
        },
      });
    }

    const output = await buildLoginOutput(
      existingAccount.id,
      existingAccount.name,
      existingAccount.email,
    );
    return res.status(200).json(output);
  }

  const newAccount = await prisma.accounts.create({
    data: {
      id: generateId(IdType.Account),
      name: googleUser.name,
      email: googleUser.email,
      status: AccountStatus.Active,
      createdAt: new Date(),
    },
  });

  const output = await buildLoginOutput(
    newAccount.id,
    newAccount.name,
    newAccount.email,
  );
  return res.status(200).json(output);
};

export const accounts = {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
};
