import React from 'react';
import { EmailLogin } from '@/components/accounts/email-login';
import { LoginOutput } from '@/types/accounts';
import { EmailRegister } from '@/components/accounts/email-register';
import { useStore } from "@/contexts/store";
import { observer } from "mobx-react-lite";

const serverUrl = 'http://localhost:3000';

export const Login = observer(() => {
  const store = useStore();
  const [showRegister, setShowRegister] = React.useState(false);

  async function handleLogin(output: LoginOutput) {
    store.addAccount(output.account);
    await window.globalDb.addAccount(output.account);

    if (output.workspaces.length > 0) {
      for (const workspace of output.workspaces) {
        store.addWorkspace(workspace);
        await window.globalDb.addWorkspace(workspace);
      }
    }
  }

  return (
    <div className="grid h-screen min-h-screen w-full grid-cols-5">
      <div className="col-span-2 flex items-center justify-center bg-zinc-950">
        <h1 className="font-neotrax text-6xl text-white">neuron</h1>
      </div>
      <div className="col-span-3 flex items-center justify-center py-12">
        <div className="mx-auto grid w-96 gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Login to Neuron
            </h1>
            <p className="text-sm text-muted-foreground">
              Use one of the following methods to login
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {showRegister ? (
              <EmailRegister serverUrl={serverUrl} onRegister={handleLogin} />
            ) : (
              <EmailLogin serverUrl={serverUrl} onLogin={handleLogin} />
            )}
            <p
              className="text-center text-sm text-muted-foreground hover:cursor-pointer hover:underline"
              onClick={() => {
                setShowRegister(!showRegister);
              }}
            >
              {showRegister
                ? 'Already have an account? Login'
                : 'No account yet? Register'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
