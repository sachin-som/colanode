import { WorkspaceRole, WorkspaceOutput, ApiErrorCode } from '@colanode/core';
import { Request, Response } from 'express';

import { database } from '@/data/database';
import { ResponseBuilder } from '@/lib/response-builder';

export const workspaceGetHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;

  const workspace = await database
    .selectFrom('workspaces')
    .selectAll()
    .where('id', '=', workspaceId)
    .executeTakeFirst();

  if (!workspace) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.WorkspaceNotFound,
      message: 'Workspace not found.',
    });
  }

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

  const output: WorkspaceOutput = {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    avatar: workspace.avatar,
    user: {
      id: user.id,
      accountId: user.account_id,
      role: user.role as WorkspaceRole,
    },
  };

  return ResponseBuilder.success(res, output);
};
