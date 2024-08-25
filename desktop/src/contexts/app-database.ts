import React from 'react';
import { CompiledQuery, Kysely, QueryResult } from 'kysely';
import { AppDatabaseSchema } from '@/data/schemas/app';

interface AppDatabaseContext {
  database: Kysely<AppDatabaseSchema>;
  executeQuery: <R>(query: CompiledQuery<R>) => Promise<QueryResult<R>>;
}

export const AppDatabaseContext = React.createContext<AppDatabaseContext>(
  {} as AppDatabaseContext,
);

export const useAppDatabase = () => React.useContext(AppDatabaseContext)!;
