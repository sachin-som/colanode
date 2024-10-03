import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/renderer/components/app';
import { TooltipProvider } from '@/renderer/components/ui/tooltip';
import { Toaster } from '@/renderer/components/ui/toaster';
import { WorkspaceCreate } from '@/renderer/components/workspaces/workspace-create';
import { Workspace } from '@/renderer/components/workspaces/workspace';
import { WorkspaceRedirect } from '@/renderer/components/workspaces/workspace-redirect';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Container } from '@/renderer/components/workspaces/containers/container';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

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
    <DndProvider backend={HTML5Backend}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
      <Toaster />
    </DndProvider>
  );
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);
