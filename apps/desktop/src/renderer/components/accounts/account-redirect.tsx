import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/renderer/contexts/app';

export const AccountRedirect = (): React.ReactNode => {
  const app = useApp();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (app.accounts.length == 0) {
      navigate('/login');
      return;
    }

    navigate(`/${app.accounts[0].id}`);
  }, [app.accounts, navigate]);

  return null;
};
