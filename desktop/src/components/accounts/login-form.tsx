import React from 'react';
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
  const [showRegister, setShowRegister] = React.useState(false);
  const [server, setServer] = React.useState(servers[0]);

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
        <EmailRegister server={server} />
      ) : (
        <EmailLogin server={server} />
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
