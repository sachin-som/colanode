import { createContext, useContext } from 'react';
import { Workspace } from '@/types/workspaces';
import { CompiledQuery, Kysely, QueryResult } from 'kysely';
import { WorkspaceDatabaseSchema } from '@/data/schemas/workspace';

interface WorkspaceContext extends Workspace {
  schema: Kysely<WorkspaceDatabaseSchema>;
  executeQuery: <R>(query: CompiledQuery<R>) => Promise<QueryResult<R>>;
  executeQueryAndSubscribe: <R>(
    queryId: string,
    query: CompiledQuery<R>,
  ) => Promise<QueryResult<R>>;
  navigateToNode: (nodeId: string) => void;
}

export const WorkspaceContext = createContext<WorkspaceContext>(
  {} as WorkspaceContext,
);

export const useWorkspace = () => useContext(WorkspaceContext);
