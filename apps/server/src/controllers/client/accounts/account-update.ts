import { Request, Response } from 'express';
import { AccountUpdateInput, AccountUpdateOutput } from '@colanode/core';

import { database } from '@/data/database';
import { ApiError } from '@/types/api';
import { eventBus } from '@/lib/event-bus';

export const accountUpdateHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const accountId = req.params.accountId;
  const input: AccountUpdateInput = req.body;

  if (accountId !== res.locals.account.id) {
    res.status(400).json({
      code: ApiError.BadRequest,
      message: 'Invalid account id.',
    });
    return;
  }

  const account = await database
    .selectFrom('accounts')
    .where('id', '=', res.locals.account.id)
    .selectAll()
    .executeTakeFirst();

  if (!account) {
    res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: 'Account not found.',
    });
    return;
  }

  const nameChanged = account.name !== input.name;
  const avatarChanged = account.avatar !== input.avatar;

  if (!nameChanged && !avatarChanged) {
    res.status(400).json({
      code: ApiError.BadRequest,
      message: 'Nothing to update.',
    });
    return;
  }

  await database
    .updateTable('accounts')
    .set({
      name: input.name,
      avatar: input.avatar,
      updated_at: new Date(),
    })
    .where('id', '=', account.id)
    .execute();

  const users = await database
    .selectFrom('users')
    .select(['id', 'workspace_id'])
    .where('account_id', '=', account.id)
    .execute();

  if (users.length > 0) {
    const userIds = users.map((u) => u.id);

    await database
      .updateTable('users')
      .set({
        name: input.name,
        avatar: input.avatar,
        updated_at: new Date(),
        updated_by: account.id,
      })
      .where('id', 'in', userIds)
      .execute();

    for (const user of users) {
      eventBus.publish({
        type: 'user_updated',
        userId: user.id,
        accountId: account.id,
        workspaceId: user.workspace_id,
      });
    }
  }

  eventBus.publish({
    type: 'account_updated',
    accountId: account.id,
  });

  const output: AccountUpdateOutput = {
    id: account.id,
    name: input.name,
    avatar: input.avatar,
  };

  res.status(200).json(output);
};
