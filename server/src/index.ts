import express, { Request, Response } from 'express';
import cors from 'cors';
import { accountsRouter } from '@/routes/accounts';
import { workspacesRouter } from '@/routes/workspaces';
import { transactionsRouter } from '@/routes/transactions';
import { authMiddleware } from '@/middlewares/auth';

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

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
