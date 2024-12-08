import { Request, Response } from 'express';

import { database } from '@/data/database';
import { ApiError } from '@/types/api';
import { eventBus } from '@/lib/event-bus';

export const workspaceDeleteHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;

  if (res.locals.workspaceUser.role !== 'owner') {
    res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
    return;
  }

  await database
    .deleteFrom('workspaces')
    .where('id', '=', workspaceId)
    .execute();

  eventBus.publish({
    type: 'workspace_deleted',
    workspaceId: workspaceId,
  });

  res.status(200).json({
    id: res.locals.workspace.id,
  });
};
