import { EventBus } from '@/lib/event-bus';
import { CompiledQuery, QueryResult } from 'kysely';
import { LocalMutationInput } from '@/types/mutations';

interface NeuronApi {
  init: () => Promise<void>;
  logout: (accountId: string) => Promise<void>;
  executeAppMutation: (mutation: LocalMutationInput) => Promise<void>;
  executeAppQuery: (query: CompiledQuery<R>) => Promise<QueryResult<R>>;
  executeAppQueryAndSubscribe: (
    queryId: string,
    query: CompiledQuery<R>,
  ) => Promise<QueryResult<R>>;
  unsubscribeAppQuery: (queryId: string) => Promise<void>;

  executeWorkspaceMutation: (
    accountId: string,
    workspaceId: string,
    input: LocalMutationInput,
  ) => Promise<void>;

  executeWorkspaceQuery: (
    accountId: string,
    workspaceId: string,
    query: CompiledQuery<R>,
  ) => Promise<QueryResult<R>>;

  executeWorkspaceQueryAndSubscribe: (
    accountId: string,
    workspaceId: string,
    queryId: string,
    query: CompiledQuery<R>,
  ) => Promise<QueryResult<R>>;

  unsubscribeWorkspaceQuery: (
    accountId: string,
    workspaceId: string,
    queryId: string,
  ) => Promise<void>;
}

declare global {
  interface Window {
    neuron: NeuronApi;
    eventBus: EventBus;
  }
}
