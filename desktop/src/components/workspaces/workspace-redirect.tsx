import React from 'react';
import { useStore } from '@/contexts/store';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

export const WorkspaceRedirect = observer(() => {
  const store = useStore();
  const workspaces = store.workspaces;
  const navigate = useNavigate();

  React.useEffect(() => {
    if (workspaces.length == 0) {
      navigate('/create');
      return;
    }

    navigate(`/${workspaces[0].id}`);
  }, [workspaces, navigate]);

  return null;
});
