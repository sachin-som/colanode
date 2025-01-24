import { Request, Response } from 'express';
import { ApiErrorCode } from '@colanode/core';

import { database } from '@/data/database';
import { eventBus } from '@/lib/event-bus';
import { ResponseBuilder } from '@/lib/response-builder';

export const workspaceDeleteHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;

  if (res.locals.user.role !== 'owner') {
    return ResponseBuilder.forbidden(res, {
      code: ApiErrorCode.WorkspaceDeleteNotAllowed,
      message:
        'You are not allowed to delete this workspace. Only owners can delete workspaces.',
    });
  }

  await database
    .deleteFrom('workspaces')
    .where('id', '=', workspaceId)
    .execute();

  eventBus.publish({
    type: 'workspace_deleted',
    workspaceId: workspaceId,
  });

  return ResponseBuilder.success(res, {
    id: res.locals.workspace.id,
  });
};
