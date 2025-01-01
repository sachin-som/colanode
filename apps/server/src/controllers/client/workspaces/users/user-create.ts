import { Request, Response } from 'express';
import {
  AccountStatus,
  ApiErrorCode,
  generateId,
  IdType,
  UserInviteResult,
  UsersInviteInput,
  UserStatus,
} from '@colanode/core';

import { database } from '@/data/database';
import { getNameFromEmail } from '@/lib/utils';
import { SelectAccount, SelectUser } from '@/data/schema';
import { eventBus } from '@/lib/event-bus';
import { ResponseBuilder } from '@/lib/response-builder';

export const userCreateHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;
  const input: UsersInviteInput = req.body;
  const user: SelectUser = res.locals.user;

  if (!input.emails || input.emails.length === 0) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.UserEmailRequired,
      message: 'User email is required.',
    });
  }

  if (user.role !== 'owner' && user.role !== 'admin') {
    return ResponseBuilder.forbidden(res, {
      code: ApiErrorCode.UserInviteNoAccess,
      message: 'You do not have access to invite users to this workspace.',
    });
  }

  const results: UserInviteResult[] = [];
  for (const email of input.emails) {
    const account = await getOrCreateAccount(email);
    if (!account) {
      results.push({
        email: email,
        result: 'error',
      });
      continue;
    }

    const existingUser = await database
      .selectFrom('users')
      .selectAll()
      .where('account_id', '=', account.id)
      .where('workspace_id', '=', workspaceId)
      .executeTakeFirst();

    if (existingUser) {
      results.push({
        email: email,
        result: 'exists',
      });
      continue;
    }

    const userId = generateId(IdType.User);
    const newUser = await database
      .insertInto('users')
      .returningAll()
      .values({
        id: userId,
        account_id: account.id,
        workspace_id: workspaceId,
        role: input.role,
        name: account.name,
        email: account.email,
        avatar: account.avatar,
        created_at: new Date(),
        created_by: res.locals.account.id,
        status: UserStatus.Active,
      })
      .executeTakeFirst();

    if (!newUser) {
      results.push({
        email: email,
        result: 'error',
      });
    }

    eventBus.publish({
      type: 'user_created',
      accountId: account.id,
      userId: userId,
      workspaceId: workspaceId,
    });

    results.push({
      email: email,
      result: 'success',
    });
  }

  return ResponseBuilder.success(res, {
    results: results,
  });
};

const getOrCreateAccount = async (
  email: string
): Promise<SelectAccount | undefined> => {
  const account = await database
    .selectFrom('accounts')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();

  if (account) {
    return account;
  }

  const createdAccount = await database
    .insertInto('accounts')
    .returningAll()
    .values({
      id: generateId(IdType.Account),
      name: getNameFromEmail(email),
      email: email,
      avatar: null,
      attrs: null,
      password: null,
      status: AccountStatus.Pending,
      created_at: new Date(),
      updated_at: null,
    })
    .executeTakeFirst();

  return createdAccount;
};
