import { createContext, useContext } from 'react';
import { Workspace } from '@/types/workspaces';
import { CompiledQuery, Kysely, QueryResult } from 'kysely';
import { WorkspaceDatabaseSchema } from '@/electron/schemas/workspace';
import { SubscribedQueryContext } from '@/types/queries';

interface WorkspaceContext extends Workspace {
  schema: Kysely<WorkspaceDatabaseSchema>;
  mutate: (mutation: CompiledQuery | CompiledQuery[]) => Promise<void>;
  query: <R>(query: CompiledQuery<R>) => Promise<QueryResult<R>>;
  queryAndSubscribe: <R>(
    context: SubscribedQueryContext<R>,
  ) => Promise<QueryResult<R>>;
  navigateToNode: (nodeId: string) => void;
  openModal: (nodeId: string) => void;
}

export const WorkspaceContext = createContext<WorkspaceContext>(
  {} as WorkspaceContext,
);

export const useWorkspace = () => useContext(WorkspaceContext);
