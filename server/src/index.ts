import express, { Request, Response } from 'express';
import cors from 'cors';
import {accounts} from "@/routes/accounts";
import {workspaces} from "@/routes/workspaces";
import {transactions} from "@/routes/transactions";
import {authMiddleware} from "@/middlewares/auth";

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

app.get('/', (req: Request, res: Response) => {
  res.send('Neuron');
});

//accounts
app.post('/v1/accounts/login/google', accounts.loginWithGoogle);
app.post('/v1/accounts/login/email', accounts.loginWithEmail);
app.post('/v1/accounts/register/email', accounts.registerWithEmail);

//workspaces
app.get('/v1/workspaces', authMiddleware, workspaces.getWorkspaces);
app.post('/v1/workspaces', authMiddleware, workspaces.createWorkspace);
app.put('/v1/workspaces/:id', authMiddleware, workspaces.updateWorkspace);
app.delete('/v1/workspaces/:id', authMiddleware, workspaces.deleteWorkspace);
app.get('/v1/workspaces/:id', authMiddleware, workspaces.getWorkspace);

//transactions
app.post('/v1/transactions', transactions.applyTransactions);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
