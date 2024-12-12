import { ServerConfig } from '@colanode/core';
import { Request, Response } from 'express';

const { SERVER_NAME, SERVER_AVATAR } = process.env;

export const configGetHandler = async (
  _: Request,
  res: Response
): Promise<void> => {
  const config: ServerConfig = {
    name: SERVER_NAME || 'Colanode',
    avatar: SERVER_AVATAR || '',
    version: '0.1.0',
    attributes: {},
  };

  res.status(200).json(config);
};
