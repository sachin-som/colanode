import { Request, Response } from 'express';
import { WorkspaceOutput, WorkspaceUpdateInput } from '@colanode/core';

import { database } from '@/data/database';
import { ApiError } from '@/types/api';
import { eventBus } from '@/lib/event-bus';

export const workspaceUpdateHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;
  const input: WorkspaceUpdateInput = req.body;

  if (res.locals.user.role !== 'owner') {
    res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
    return;
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
    res.status(500).json({
      code: ApiError.InternalServerError,
      message: 'Internal server error.',
    });
    return;
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

  res.status(200).json(output);
};
