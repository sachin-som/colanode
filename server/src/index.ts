import express, { Request, Response } from 'express';
import {accounts} from "./routes/accounts";

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

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
