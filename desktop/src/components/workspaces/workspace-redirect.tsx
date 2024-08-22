import React from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useAccount } from '@/contexts/account';

export const WorkspaceRedirect = observer(() => {
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
});
