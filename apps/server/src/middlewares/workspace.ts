import { NextFunction, Request, RequestHandler, Response } from 'express';

import { database } from '@/data/database';
import { ApiError } from '@/types/api';

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
    res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
    return;
  }

  res.locals.user = user;

  next();
};
