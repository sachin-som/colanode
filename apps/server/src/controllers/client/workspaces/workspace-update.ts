import { Request, Response } from 'express';
import {
  WorkspaceOutput,
  WorkspaceUpdateInput,
  ApiErrorCode,
} from '@colanode/core';

import { database } from '@/data/database';
import { eventBus } from '@/lib/event-bus';
import { ResponseBuilder } from '@/lib/response-builder';

export const workspaceUpdateHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;
  const input: WorkspaceUpdateInput = req.body;

  if (res.locals.user.role !== 'owner') {
    return ResponseBuilder.forbidden(res, {
      code: ApiErrorCode.WorkspaceUpdateNotAllowed,
      message:
        'You are not allowed to update this workspace. Only owners can update workspaces.',
    });
  }

  const updatedWorkspace = await database
    .updateTable('workspaces')
    .set({
      name: input.name,
      description: input.description,
      avatar: input.avatar,
      updated_at: new Date(),
      updated_by: res.locals.account.id,
    })
    .where('id', '=', workspaceId)
    .returningAll()
    .executeTakeFirst();

  if (!updatedWorkspace) {
    return ResponseBuilder.internalError(res, {
      code: ApiErrorCode.WorkspaceUpdateFailed,
      message: 'Failed to update workspace.',
    });
  }

  eventBus.publish({
    type: 'workspace_updated',
    workspaceId: updatedWorkspace.id,
  });

  const output: WorkspaceOutput = {
    id: updatedWorkspace.id,
    name: updatedWorkspace.name,
    description: updatedWorkspace.description,
    avatar: updatedWorkspace.avatar,
    versionId: updatedWorkspace.version_id,
    user: {
      id: res.locals.user.id,
      accountId: res.locals.user.account_id,
      role: res.locals.user.role,
    },
  };

  return ResponseBuilder.success(res, output);
};
