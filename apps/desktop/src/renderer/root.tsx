import '@/renderer/styles/index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/renderer/app';
import { TooltipProvider } from '@/renderer/components/ui/tooltip';
import { Toaster } from '@/renderer/components/ui/toaster';
import { WorkspaceCreate } from '@/renderer/components/workspaces/workspace-create';
import { Workspace } from '@/renderer/components/workspaces/workspace';
import { WorkspaceRedirect } from '@/renderer/components/workspaces/workspace-redirect';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { Container } from '@/renderer/components/workspaces/containers/container';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Login } from '@/renderer/components/accounts/login';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEventBus } from '@/renderer/hooks/use-event-bus';

const router = createHashRouter([
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
        path: '/login',
        element: <Login />,
      },
      {
        path: ':userId',
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

const queryClient = new QueryClient();

const Root = () => {
  const eventBus = useEventBus();

  React.useEffect(() => {
    const id = eventBus.subscribe((event) => {
      if (
        event.event === 'query_result_updated' &&
        event.payload &&
        event.payload.id &&
        event.payload.result
      ) {
        const result = event.payload.result;
        const queryId = event.payload.id;

        if (!result) {
          return;
        }

        if (!queryId) {
          return;
        }

        const existingData = queryClient.getQueryData<any>([queryId]);

        if (!existingData) {
          window.colanode.unsubscribeQuery(queryId);
          return;
        } else {
          queryClient.setQueryData([queryId], result);
        }
      }
    });

    queryClient.getQueryCache().subscribe(async (event) => {
      if (
        event.type === 'removed' &&
        event.query &&
        event.query.queryKey &&
        event.query.queryKey.length > 0
      ) {
        await window.colanode.unsubscribeQuery(event.query.queryKey[0]);
      }
    });

    return () => {
      eventBus.unsubscribe(id);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={HTML5Backend}>
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
        <Toaster />
      </DndProvider>
    </QueryClientProvider>
  );
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);
