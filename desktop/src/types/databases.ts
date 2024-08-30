import { CompiledQuery, QueryResult } from 'kysely';

export type SubscribedQueryContext<T> = {
  key: string[];
  page?: number;
  query: CompiledQuery<T>;
};

export type SubscribedQueryResult<T> = {
  context: SubscribedQueryContext<T>;
  tables: string[];
  result: QueryResult<T>;
};
