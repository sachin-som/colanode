import { createContext, useContext } from 'react';
import { Workspace } from '@/types/workspaces';
import { CompiledQuery, Kysely, QueryResult } from 'kysely';
import { WorkspaceDatabaseSchema } from '@/data/schemas/workspace';
import { LocalMutation } from '@/types/mutations';

interface WorkspaceContext extends Workspace {
  schema: Kysely<WorkspaceDatabaseSchema>;
  mutate: (mutation: LocalMutation) => Promise<void>;
  query: <R>(query: CompiledQuery<R>) => Promise<QueryResult<R>>;
  queryAndSubscribe: <R>(
    queryId: string,
    query: CompiledQuery<R>,
  ) => Promise<QueryResult<R>>;
  navigateToNode: (nodeId: string) => void;
}

export const WorkspaceContext = createContext<WorkspaceContext>(
  {} as WorkspaceContext,
);

export const useWorkspace = () => useContext(WorkspaceContext);
