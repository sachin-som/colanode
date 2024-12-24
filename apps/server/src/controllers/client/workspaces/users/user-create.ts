import { Request, Response } from 'express';
import {
  AccountStatus,
  generateId,
  IdType,
  UserInviteResult,
  UsersInviteInput,
  UserStatus,
} from '@colanode/core';

import { database } from '@/data/database';
import { ApiError } from '@/types/api';
import { getNameFromEmail } from '@/lib/utils';
import { SelectUser } from '@/data/schema';
import { eventBus } from '@/lib/event-bus';

export const userCreateHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;
  const input: UsersInviteInput = req.body;
  const user: SelectUser = res.locals.user;

  if (!input.emails || input.emails.length === 0) {
    res.status(400).json({
      code: ApiError.BadRequest,
      message: 'BadRequest.',
    });
    return;
  }

  if (!res.locals.account) {
    res.status(401).json({
      code: ApiError.Unauthorized,
      message: 'Unauthorized.',
    });
    return;
  }

  if (user.role !== 'owner' && user.role !== 'admin') {
    res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
    return;
  }

  const results: UserInviteResult[] = [];
  for (const email of input.emails) {
    let account = await database
      .selectFrom('accounts')
      .select(['id', 'name', 'email', 'avatar'])
      .where('email', '=', email)
      .executeTakeFirst();

    if (!account) {
      account = await database
        .insertInto('accounts')
        .returning(['id', 'name', 'email', 'avatar'])
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
    }

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

  res.status(200).json({
    results: results,
  });
};
