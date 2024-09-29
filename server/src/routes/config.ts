import { Router, Request, Response } from 'express';

export const configRouter = Router();

configRouter.get('/', async (req: Request, res: Response) => {
  res.status(200).json({
    name: 'Neuron Cloud',
    avatar: '',
    version: '0.1.0',
    attributes: {
      insecure: true,
    },
  });
});
