import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/components/app';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { StoreContext } from '@/contexts/store';
import { store } from '@/store';
import { WorkspaceCreate } from '@/components/workspaces/workspace-create';
import { Workspace } from '@/components/workspaces/workspace';
import { WorkspaceRedirect } from '@/components/workspaces/workspace-redirect';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Container } from '@/components/workspaces/container';

const router = createBrowserRouter([
  {
    path: '',
    element: <App />,
    children: [
      {
        path: '',
        element: <WorkspaceRedirect />,
      },
      {
        path: '/create',
        element: <WorkspaceCreate />,
      },
      {
        path: ':workspaceId',
        element: <Workspace />,
        children: [
          {
            path: ':nodeId',
            element: <Container />,
          },
        ],
      },
    ],
  },
]);

export const Root = () => {
  return (
    <StoreContext.Provider value={store}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
      <Toaster />
    </StoreContext.Provider>
  );
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);
