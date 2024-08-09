import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';

import { accountsRouter } from '@/routes/accounts';
import { workspacesRouter } from '@/routes/workspaces';
import { transactionsRouter } from '@/routes/transactions';
import { authMiddleware } from '@/middlewares/auth';
import { sockets } from '@/lib/sockets';

export const initApi = () => {
  const app = express();
  const port = 3000;

  app.use(express.json());
  app.use(cors());

  app.get('/', (req: Request, res: Response) => {
    res.send('Neuron');
  });

  app.use('/v1/accounts', accountsRouter);
  app.use('/v1/workspaces', authMiddleware, workspacesRouter);
  app.use('/v1/transactions', authMiddleware, transactionsRouter);

  const server = http.createServer(app);

  const wss = new WebSocketServer({
    server,
    path: '/synapse',
  });

  wss.on('connection', (socket, req) => {
    const deviceId = req.url?.split('device_id=')[1];
    if (!deviceId) {
      socket.close();
      return;
    }

    sockets.addSocket(deviceId, socket);

    socket.on('message', (message) => {
      console.log(`Received message: ${message}`);
    });

    socket.on('close', () => {
      sockets.removeSocket(deviceId);
    });
  });

  server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
};
