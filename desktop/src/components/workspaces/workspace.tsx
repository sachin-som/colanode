import React from 'react';
import { Sidebar } from '@/components/workspaces/sidebars/sidebar';
import { WorkspaceContext } from '@/contexts/workspace';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import {
  DummyDriver,
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from 'kysely';
import { WorkspaceDatabaseSchema } from '@/data/schemas/workspace';
import { useAccount } from '@/contexts/account';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEventBus } from '@/hooks/use-event-bus';

const workspaceDatabase = new Kysely<WorkspaceDatabaseSchema>({
  dialect: {
    createAdapter: () => new SqliteAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler(),
  },
});

export const Workspace = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const account = useAccount();
  const navigate = useNavigate();
  const eventBus = useEventBus();
  const workspace = account.workspaces.find((w) => w.id === workspaceId);

  const queryClient = React.useMemo(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  }, [workspaceId]);

  React.useEffect(() => {
    if (!workspace) {
      return;
    }

    const id = eventBus.subscribe((event) => {
      if (event.event === 'workspace_query_updated') {
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
          window.neuron.unsubscribeWorkspaceQuery(
            workspace.accountId,
            workspace.id,
            queryKey,
          );
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
        await window.neuron.unsubscribeWorkspaceQuery(
          workspace.accountId,
          workspace.id,
          event.query.queryKey,
        );
      }
    });

    return () => {
      eventBus.unsubscribe(id);
    };
  }, [workspace]);

  if (!workspace) {
    return <p>Workspace not found</p>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceContext.Provider
        value={{
          ...workspace,
          schema: workspaceDatabase,
          mutate: (input) =>
            window.neuron.executeWorkspaceMutation(
              workspace.accountId,
              workspace.id,
              input,
            ),
          query: (query) =>
            window.neuron.executeWorkspaceQuery(
              workspace.accountId,
              workspace.id,
              query,
            ),
          queryAndSubscribe: (context) =>
            window.neuron.executeWorkspaceQueryAndSubscribe(
              workspace.accountId,
              workspace.id,
              context,
            ),
          navigateToNode(nodeId) {
            navigate(`/${workspaceId}/${nodeId}`);
          },
          openModal(modal) {
            // setModal(modal);
          },
        }}
      >
        <div className="flex h-screen max-h-screen flex-row">
          <div className="w-96">
            <Sidebar />
          </div>
          <main className="h-full w-full min-w-128 flex-grow overflow-hidden bg-white">
            <Outlet />
          </main>
        </div>
      </WorkspaceContext.Provider>
    </QueryClientProvider>
  );
};
