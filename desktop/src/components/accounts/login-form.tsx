import React from 'react';
import { useAppDatabase } from '@/contexts/app-database';
import { LoginOutput } from '@/types/accounts';
import { Server } from '@/types/servers';
import { EmailRegister } from '@/components/accounts/email-register';
import { EmailLogin } from '@/components/accounts/email-login';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { Avatar } from '@/components/ui/avatar';

interface LoginFormProps {
  servers: Server[];
}

export const LoginForm = ({ servers }: LoginFormProps) => {
  const appDatabase = useAppDatabase();
  const [showRegister, setShowRegister] = React.useState(false);
  const [server, setServer] = React.useState(servers[0]);
  const serverUrl = `http://${server.domain}`;

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
        server: server.domain,
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
    <div className="flex flex-col gap-4">
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex w-full flex-grow flex-row items-center gap-2 rounded-md border border-input p-2 hover:cursor-pointer hover:bg-gray-100">
              <Avatar id={server.domain} name={server.name} />
              <div className="flex-grow">
                <p className="flex-grow font-semibold">{server.name}</p>
                <p className="text-xs text-muted-foreground">{server.domain}</p>
              </div>

              <Icon
                name="arrow-down-s-line"
                className="h-4 w-4 text-muted-foreground"
              />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-96">
            {servers.map((server) => (
              <DropdownMenuItem
                key={server.domain}
                onSelect={() => {
                  setServer(server);
                }}
                className="flex w-full flex-grow flex-row items-center gap-2 rounded-md border-b border-input p-2 hover:cursor-pointer hover:bg-gray-100"
              >
                <Avatar id={server.domain} name={server.name} />
                <div className="flex-grow">
                  <p className="flex-grow font-semibold">{server.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {server.domain}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
  );
};
