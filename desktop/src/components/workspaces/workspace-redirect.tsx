import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@/contexts/account';

export const WorkspaceRedirect = (): React.ReactNode => {
  const account = useAccount();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (account.workspaces.length == 0) {
      navigate('/create');
      return;
    }

    navigate(`/${account.workspaces[0].id}`);
  }, [account.workspaces, navigate]);

  return null;
};
