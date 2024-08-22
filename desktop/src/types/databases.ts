import { CompiledQuery, QueryResult } from 'kysely';

export type SubscribedQueryData<T> = {
  query: CompiledQuery<T>;
  tables: string[];
  result: QueryResult<T>;
};
