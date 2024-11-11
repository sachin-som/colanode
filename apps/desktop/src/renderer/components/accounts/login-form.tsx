import React from 'react';
import { EmailRegister } from '@/renderer/components/accounts/email-register';
import { EmailLogin } from '@/renderer/components/accounts/email-login';
import { ServerDropdown } from '@/renderer/components/servers/server-dropdown';
import { useApp } from '@/renderer/contexts/app';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/renderer/components/ui/separator';

export const LoginForm = () => {
  const app = useApp();
  const navigate = useNavigate();

  const [showRegister, setShowRegister] = React.useState(false);
  const [server, setServer] = React.useState(app.servers[0]);

  return (
    <div className="flex flex-col gap-4">
      <ServerDropdown value={server} onChange={setServer} />
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
      {app.accounts.length > 0 && (
        <React.Fragment>
          <Separator className="w-full" />
          <p
            className="text-center text-sm text-muted-foreground hover:cursor-pointer hover:underline"
            onClick={() => {
              navigate(-1);
            }}
          >
            Cancel
          </p>
        </React.Fragment>
      )}
    </div>
  );
};
