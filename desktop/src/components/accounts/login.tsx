import React from 'react';
import { EmailLogin } from '@/components/accounts/email-login';
import { LoginOutput } from '@/types/accounts';
import { EmailRegister } from '@/components/accounts/email-register';
import { useAppDatabase } from '@/contexts/app-database';

const SERVER_URL = 'http://localhost:3000';

export const Login = () => {
  const appDatabase = useAppDatabase();
  const [showRegister, setShowRegister] = React.useState(false);

  const handleLogin = async (output: LoginOutput) => {
    const insertAccountQuery = appDatabase.database
      .insertInto('accounts')
      .values({
        id: output.account.id,
        name: output.account.name,
        avatar: output.account.avatar,
        device_id: output.account.deviceId,
        email: output.account.email,
        token: output.account.token,
      })
      .compile();

    await appDatabase.mutate(insertAccountQuery);

    if (output.workspaces.length > 0) {
      const insertWorkspacesQuery = appDatabase.database
        .insertInto('workspaces')
        .values(
          output.workspaces.map((workspace) => ({
            id: workspace.id,
            name: workspace.name,
            account_id: output.account.id,
            avatar: workspace.avatar,
            role: workspace.role,
            description: workspace.description,
            synced: 0,
            user_id: workspace.userId,
            version_id: workspace.versionId,
          })),
        )
        .compile();

      await appDatabase.mutate(insertWorkspacesQuery);
    }

    window.location.href = '/';
  };

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
              <EmailRegister serverUrl={SERVER_URL} onRegister={handleLogin} />
            ) : (
              <EmailLogin serverUrl={SERVER_URL} onLogin={handleLogin} />
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
};
