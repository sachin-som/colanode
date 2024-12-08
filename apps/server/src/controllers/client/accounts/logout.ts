import { Request, Response } from 'express';

import { database } from '@/data/database';
import { eventBus } from '@/lib/event-bus';

export const logoutHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const account = res.locals.account;

  await database
    .deleteFrom('devices')
    .where('id', '=', account.deviceId)
    .execute();

  eventBus.publish({
    type: 'device_deleted',
    accountId: account.id,
    deviceId: account.deviceId,
  });

  res.status(200).end();
};
