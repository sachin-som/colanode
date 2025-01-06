import React from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';

import { AccountLogout } from '@/renderer/components/accounts/account-logout';
import { AccountSettingsDialog } from '@/renderer/components/accounts/account-settings-dialog';
import { AccountContext } from '@/renderer/contexts/account';
import { AccountNotFound } from '@/renderer/components/accounts/account-not-found';
import { useQuery } from '@/renderer/hooks/use-query';

export const Account = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();

  const [openSettings, setOpenSettings] = React.useState(false);
  const [openLogout, setOpenLogout] = React.useState(false);

  const { data, isPending } = useQuery(
    {
      type: 'account_get',
      accountId: accountId ?? '',
    },
    {
      enabled: !!accountId,
    }
  );

  if (!accountId || isPending) {
    return null;
  }

  if (!data) {
    return <AccountNotFound />;
  }

  const account = data;
  return (
    <AccountContext.Provider
      value={{
        ...account,
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
            navigate('/');
          }}
        />
      )}
    </AccountContext.Provider>
  );
};
