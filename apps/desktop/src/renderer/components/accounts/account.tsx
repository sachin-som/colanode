import React from 'react';
import { AccountContext } from '@/renderer/contexts/account';
import { useApp } from '@/renderer/contexts/app';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { AccountLogout } from './account-logout';
import { AccountSettingsDialog } from './account-settings-dialog';

export const Account = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const app = useApp();

  const [openSettings, setOpenSettings] = React.useState(false);
  const [openLogout, setOpenLogout] = React.useState(false);

  const account = app.accounts.find((a) => a.id === accountId);

  if (!account) {
    return <p>Account not found</p>;
  }

  const workspaces = app.workspaces.filter((w) => w.accountId === account.id);

  return (
    <AccountContext.Provider
      value={{
        ...account,
        workspaces,
        openSettings: () => setOpenSettings(true),
        openLogout: () => setOpenLogout(true),
      }}
    >
      <Outlet />
      {openSettings && (
        <AccountSettingsDialog
          open={true}
          onOpenChange={() => setOpenSettings(false)}
        />
      )}
      {openLogout && (
        <AccountLogout
          onCancel={() => setOpenLogout(false)}
          onLogout={() => {
            setOpenLogout(false);
            const activeAccounts =
              app.accounts?.filter((a) => a.id !== account.id) ?? [];
            if (activeAccounts.length > 0) {
              navigate(`/${activeAccounts[0].id}`);
              return;
            }

            navigate('/login');
          }}
        />
      )}
    </AccountContext.Provider>
  );
};
