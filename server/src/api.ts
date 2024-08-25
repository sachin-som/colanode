import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';

import { accountsRouter } from '@/routes/accounts';
import { workspacesRouter } from '@/routes/workspaces';
import { mutationsRouter } from '@/routes/mutations';
import { authMiddleware } from '@/middlewares/auth';
import { sockets } from '@/lib/sockets';
import { SocketMessage } from '@/types/sockets';
import { prisma } from '@/data/prisma';

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
  app.use('/v1/mutations', authMiddleware, mutationsRouter);

  const server = http.createServer(app);

  const wss = new WebSocketServer({
    server,
    path: '/v1/synapse',
  });

  wss.on('connection', (socket, req) => {
    console.log('New connection', req.url);
    const deviceId = req.url?.split('device_id=')[1];
    if (!deviceId) {
      socket.close();
      return;
    }

    sockets.addSocket(deviceId, socket);

    socket.on('message', async (message) => {
      const socketMessage: SocketMessage = JSON.parse(message.toString());
      if (socketMessage.type === 'mutation_ack') {
        const mutationId = socketMessage.payload.id;
        if (!mutationId) {
          return;
        }

        await prisma.$executeRaw`
          UPDATE mutations
          SET devices = array_remove(devices, ${deviceId})
          WHERE id = ${mutationId};
        `;
      }
    });

    socket.on('close', () => {
      sockets.removeSocket(deviceId);
    });
  });

  server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
};
