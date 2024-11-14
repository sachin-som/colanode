import { AccountContext } from '@/renderer/contexts/account';
import { useApp } from '@/renderer/contexts/app';
import { Outlet, useParams } from 'react-router-dom';

export const Account = () => {
  const { accountId } = useParams<{ accountId: string }>();

  const app = useApp();
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
      }}
    >
      <Outlet />
    </AccountContext.Provider>
  );
};
