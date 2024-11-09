import { Router, Request, Response } from 'express';

export const configRouter = Router();

configRouter.get('/', async (_: Request, res: Response) => {
  res.status(200).json({
    name: 'Colanode Cloud',
    avatar: '',
    version: '0.1.0',
    attributes: {
      insecure: true,
    },
  });
});
