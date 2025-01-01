import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ApiErrorCode } from '@colanode/core';

import { database } from '@/data/database';
import { ResponseBuilder } from '@/lib/response-builder';

export const workspaceMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const workspaceId = req.params.workspaceId as string;

  const user = await database
    .selectFrom('users')
    .selectAll()
    .where('workspace_id', '=', workspaceId)
    .where('account_id', '=', res.locals.account.id)
    .executeTakeFirst();

  if (!user) {
    return ResponseBuilder.forbidden(res, {
      code: ApiErrorCode.WorkspaceNoAccess,
      message: 'You do not have access to this workspace.',
    });
  }

  res.locals.user = user;

  next();
};
