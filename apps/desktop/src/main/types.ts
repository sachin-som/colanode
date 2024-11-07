import { AppDatabaseSchema } from '@/main/data/app/schema';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';
import { MutationInput, MutationMap } from '@/operations/mutations';
import { QueryInput, QueryMap } from '@/operations/queries';

export interface MutationHandler<T extends MutationInput> {
  handleMutation: (input: T) => Promise<MutationResult<T>>;
}

export type MutationResult<T extends MutationInput> = {
  output: MutationMap[T['type']]['output'];
  changes?: MutationChange[];
};

export type MutationChange = AppMutationChange | WorkspaceMutationChange;

export type AppMutationChange = {
  type: 'app';
  table: keyof AppDatabaseSchema;
};

export type WorkspaceMutationChange = {
  type: 'workspace';
  table: keyof WorkspaceDatabaseSchema;
  userId: string;
};

export interface QueryHandler<T extends QueryInput> {
  handleQuery: (input: T) => Promise<QueryResult<T>>;
  checkForChanges: (
    changes: MutationChange[],
    input: T,
    state: Record<string, any>
  ) => Promise<ChangeCheckResult<T>>;
}

export type QueryResult<T extends QueryInput> = {
  output: QueryMap[T['type']]['output'];
  state: Record<string, any>;
};

export type SubscribedQuery<T extends QueryInput> = {
  input: T;
  result: QueryResult<T>;
};

export type ChangeCheckResult<T extends QueryInput> = {
  hasChanges: boolean;
  result?: QueryResult<T>;
};
