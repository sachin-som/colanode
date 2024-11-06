import React from 'react';
import { Server } from '@/types/servers';
import { EmailRegister } from '@/renderer/components/accounts/email-register';
import { EmailLogin } from '@/renderer/components/accounts/email-login';
import { ServerDropdown } from '@/renderer/components/servers/server-dropdown';

interface LoginFormProps {
  servers: Server[];
}

export const LoginForm = ({ servers }: LoginFormProps) => {
  const [showRegister, setShowRegister] = React.useState(false);
  const [server, setServer] = React.useState(servers[0]);

  return (
    <div className="flex flex-col gap-4">
      <ServerDropdown servers={servers} value={server} onChange={setServer} />
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
