import { ServerConfig } from '@colanode/core';
import { Request, Response } from 'express';

import { configuration } from '@/lib/configuration';

export const configGetHandler = async (
  _: Request,
  res: Response
): Promise<void> => {
  const config: ServerConfig = {
    name: configuration.server.name,
    avatar: configuration.server.avatar,
    version: '0.1.0',
    ip: res.locals.ip,
    attributes: {},
  };

  res.status(200).json(config);
};
