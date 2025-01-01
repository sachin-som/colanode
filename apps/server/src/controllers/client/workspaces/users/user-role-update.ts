import { Request, Response } from 'express';
import { UserRoleUpdateInput, ApiErrorCode } from '@colanode/core';

import { database } from '@/data/database';
import { SelectUser } from '@/data/schema';
import { eventBus } from '@/lib/event-bus';
import { ResponseBuilder } from '@/lib/response-builder';

export const userRoleUpdateHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.params.userId as string;
  const input: UserRoleUpdateInput = req.body;
  const user: SelectUser = res.locals.user;

  if (user.role !== 'owner' && user.role !== 'admin') {
    return ResponseBuilder.forbidden(res, {
      code: ApiErrorCode.UserUpdateNoAccess,
      message: 'You do not have access to update users to this workspace.',
    });
  }

  const userToUpdate = await database
    .selectFrom('users')
    .selectAll()
    .where('id', '=', userId)
    .executeTakeFirst();

  if (!userToUpdate) {
    return ResponseBuilder.notFound(res, {
      code: ApiErrorCode.UserNotFound,
      message: 'User not found.',
    });
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

  return ResponseBuilder.success(res, {
    success: true,
  });
};
