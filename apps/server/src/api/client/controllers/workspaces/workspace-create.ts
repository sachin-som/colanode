import { WorkspaceCreateInput, ApiErrorCode } from '@colanode/core';
import { Request, Response } from 'express';

import { database } from '@/data/database';
import { ResponseBuilder } from '@/lib/response-builder';
import { createWorkspace } from '@/lib/workspaces';

export const workspaceCreateHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input: WorkspaceCreateInput = req.body;

  if (!input.name) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.WorkspaceNameRequired,
      message: 'Workspace name is required.',
    });
  }

  const account = await database
    .selectFrom('accounts')
    .selectAll()
    .where('id', '=', res.locals.account.id)
    .executeTakeFirst();

  if (!account) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.AccountNotFound,
      message: 'Account not found.',
    });
  }

  const output = await createWorkspace(account, input);
  return ResponseBuilder.success(res, output);
};
