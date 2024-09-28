import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';

import { accountsRouter } from '@/routes/accounts';
import { workspacesRouter } from '@/routes/workspaces';
import { mutationsRouter } from '@/routes/mutations';
import { authMiddleware } from '@/middlewares/auth';
import { syncRouter } from '@/routes/sync';
import { configRouter } from '@/routes/config';
import { synapse } from '@/synapse';

export const initApi = () => {
  const app = express();
  const port = 3000;

  app.use(express.json());
  app.use(cors());

  app.get('/', (req: Request, res: Response) => {
    res.send('Neuron');
  });

  app.use('/v1/accounts', accountsRouter);
  app.use('/v1/config', configRouter);
  app.use('/v1/workspaces', authMiddleware, workspacesRouter);
  app.use('/v1/mutations', authMiddleware, mutationsRouter);
  app.use('/v1/', authMiddleware, syncRouter);

  const server = http.createServer(app);

  const wss = new WebSocketServer({
    server,
    path: '/v1/synapse',
  });

  wss.on('connection', async (socket, req) => {
    await synapse.addConnection(socket, req);
  });

  server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
};
