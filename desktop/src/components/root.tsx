import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/components/app';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { WorkspaceCreate } from '@/components/workspaces/workspace-create';
import { Workspace } from '@/components/workspaces/workspace';
import { WorkspaceRedirect } from '@/components/workspaces/workspace-redirect';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Container } from '@/components/workspaces/container';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { eventBus } from '@/lib/event-bus';

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
  const queryClient = React.useMemo(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  }, []);

  React.useEffect(() => {
    const id = eventBus.subscribe((event) => {
      if (event.event === 'app_query_updated') {
        const result = event.payload.result;
        const queryKey = event.payload.key;
        const page = event.payload.page;

        if (!result) {
          return;
        }

        if (!queryKey) {
          return;
        }

        const existingData = queryClient.getQueryData<any>(queryKey);

        if (!existingData) {
          window.neuron.unsubscribeAppQuery(queryKey);
          return;
        }

        if (page !== undefined && page != null) {
          const index = existingData.pageParams.indexOf(page);
          if (index === -1) {
            return;
          }

          const newData = {
            pageParams: existingData.pageParams,
            pages: existingData.pages.map((p: any, i: number) => {
              if (i === index) {
                return result;
              }

              return p;
            }),
          };
          queryClient.setQueryData(queryKey, newData);
        } else {
          queryClient.setQueryData(queryKey, result);
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
        await window.neuron.unsubscribeAppQuery(event.query.queryKey);
      }
    });

    return () => {
      eventBus.unsubscribe(id);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
      <Toaster />
    </QueryClientProvider>
  );
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);
