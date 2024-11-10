import React from 'react';
import { AccountContext } from '@/renderer/contexts/account';
import { useApp } from '@/renderer/contexts/app';
import { Login } from '@/renderer/components/accounts/login';
import { useParams } from 'react-router-dom';

interface AccountProviderProps {
  children: React.ReactNode;
}

export const AccountProvider = ({ children }: AccountProviderProps) => {
  const app = useApp();
  const { userId } = useParams<{ userId: string }>();

  if (app.accounts.length === 0) {
    return <Login />;
  }

  const workspace = app.workspaces.find(
    (workspace) => workspace.userId === userId
  );

  let account = app.accounts[0];
  if (workspace) {
    const workspaceAccount = app.accounts.find(
      (account) => account.id === workspace.accountId
    );

    if (workspaceAccount) {
      account = workspaceAccount;
    }
  }

  const workspaces = app.workspaces.filter(
    (workspace) => workspace.accountId === account.id
  );

  return (
    <AccountContext.Provider
      value={{
        ...account,
        workspaces,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};
