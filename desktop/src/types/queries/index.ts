import { MutationChange } from '@/types/mutations';

export interface QueryMap {}

export type QueryInput = QueryMap[keyof QueryMap]['input'];

export interface QueryHandler<T extends QueryInput> {
  handleQuery: (input: T) => Promise<QueryResult<T>>;
  checkForChanges: (
    changes: MutationChange[],
    input: T,
    state: Record<string, any>,
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
