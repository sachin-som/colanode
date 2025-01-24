import cors from 'cors';
import express, { Request, Response } from 'express';
import { createDebugger } from '@colanode/core';

import http from 'http';

import { clientRouter } from '@/api/client/routes';
import { ipMiddleware } from '@/api/client/middlewares/ip';
import { socketService } from '@/services/socket-service';

const debug = createDebugger('server:app');

export const initApp = async () => {
  const app = express();
  const port = 3000;

  app.use(
    express.json({
      limit: '50mb',
    })
  );
  app.use(cors());
  app.use(ipMiddleware);

  app.get('/', (_: Request, res: Response) => {
    res.send(
      'This is a Colanode server. For more information, visit https://colanode.com'
    );
  });

  app.use('/client', clientRouter);

  const server = http.createServer(app);
  await socketService.init(server);

  server.listen(port, () => {
    debug(`Server is running at http://localhost:${port}`);
  });
};
