import React from 'react';
import { CompiledQuery, Kysely, QueryResult } from 'kysely';
import { AppDatabaseSchema } from '@/data/schemas/app';
import { SubscribedQueryContext } from '@/types/queries';

interface AppDatabaseContext {
  database: Kysely<AppDatabaseSchema>;
  mutate: (mutation: CompiledQuery) => Promise<void>;
  query: <R>(query: CompiledQuery<R>) => Promise<QueryResult<R>>;
  queryAndSubscribe: <R>(
    context: SubscribedQueryContext<R>,
  ) => Promise<QueryResult<R>>;
}

export const AppDatabaseContext = React.createContext<AppDatabaseContext>(
  {} as AppDatabaseContext,
);

export const useAppDatabase = () => React.useContext(AppDatabaseContext)!;
