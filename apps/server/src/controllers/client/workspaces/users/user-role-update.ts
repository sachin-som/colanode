import { Request, Response } from 'express';
import { UserRoleUpdateInput } from '@colanode/core';

import { database } from '@/data/database';
import { ApiError } from '@/types/api';
import { SelectUser } from '@/data/schema';
import { eventBus } from '@/lib/event-bus';

export const userRoleUpdateHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.params.userId as string;
  const input: UserRoleUpdateInput = req.body;
  const user: SelectUser = res.locals.user;

  if (user.role !== 'owner' && user.role !== 'admin') {
    res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
    return;
  }

  const userToUpdate = await database
    .selectFrom('users')
    .selectAll()
    .where('id', '=', userId)
    .executeTakeFirst();

  if (!userToUpdate) {
    res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: 'NotFound.',
    });
    return;
  }

  await database
    .updateTable('users')
    .set({
      role: input.role,
      updated_at: new Date(),
      updated_by: user.id,
    })
    .where('id', '=', userToUpdate.id)
    .execute();

  eventBus.publish({
    type: 'user_updated',
    userId: userToUpdate.id,
    accountId: user.account_id,
    workspaceId: userToUpdate.workspace_id,
  });

  res.status(200).json({
    success: true,
  });
};
