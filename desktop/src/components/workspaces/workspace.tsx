import React from 'react';
import { Sidebar } from '@/components/workspaces/sidebar';
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
        const queryKey = event.payload.queryId;

        if (result && queryKey) {
          queryClient.setQueryData([queryKey], result);
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
        const queryKey = event.query.queryKey[0];
        await window.neuron.unsubscribeWorkspaceQuery(
          workspace.accountId,
          workspace.id,
          queryKey,
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
          queryAndSubscribe: (queryId, query) =>
            window.neuron.executeWorkspaceQueryAndSubscribe(
              workspace.accountId,
              workspace.id,
              queryId,
              query,
            ),
          navigateToNode(nodeId) {
            navigate(`/${workspaceId}/${nodeId}`);
          },
        }}
      >
        <div className="flex h-screen max-h-screen flex-row">
          <div className="w-96">
            <Sidebar />
          </div>
          <main className="min-w-128 h-full w-full flex-grow overflow-hidden bg-white">
            <Outlet />
          </main>
        </div>
      </WorkspaceContext.Provider>
    </QueryClientProvider>
  );
};
