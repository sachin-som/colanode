import express, { Request, Response } from 'express';
import {accounts} from "@/routes/accounts";
import {workspaces} from "@/routes/workspaces";

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Neuron');
});

//accounts
app.post('/v1/accounts/login/google', accounts.loginWithGoogle);
app.post('/v1/accounts/login/email', accounts.loginWithEmail);
app.post('/v1/accounts/register/email', accounts.registerWithEmail);

//workspaces
app.post('/v1/workspaces', workspaces.createWorkspace);
app.put('/v1/workspaces/:id', workspaces.updateWorkspace);
app.delete('/v1/workspaces/:id', workspaces.deleteWorkspace);
app.get('/v1/workspaces/:id', workspaces.getWorkspace);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
