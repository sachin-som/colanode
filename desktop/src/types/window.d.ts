import { EventBus } from '@/lib/event-bus';
import { CompiledQuery, QueryResult } from 'kysely';
import { LocalMutationInput } from '@/types/mutations';
import { SubscribedQueryContext } from '@/types/queries';
import { MutationMap, MutationInput } from '@/types/mutations';
import { QueryMap, QueryInput } from '@/types/queries';

interface NeuronApi {
  init: () => Promise<void>;
  logout: (accountId: string) => Promise<void>;
  executeAppMutation: (
    mutation: CompiledQuery | CompiledQuery[],
  ) => Promise<void>;
  executeAppQuery: (query: CompiledQuery<R>) => Promise<QueryResult<R>>;
  executeAppQueryAndSubscribe: (
    context: SubscribedQueryContext<R>,
  ) => Promise<QueryResult<R>>;
  unsubscribeAppQuery: (queryKey: string[]) => Promise<void>;

  executeWorkspaceMutation: (
    accountId: string,
    workspaceId: string,
    mutation: CompiledQuery | CompiledQuery[],
  ) => Promise<void>;

  executeWorkspaceQuery: (
    accountId: string,
    workspaceId: string,
    query: CompiledQuery<R>,
  ) => Promise<QueryResult<R>>;

  executeWorkspaceQueryAndSubscribe: (
    accountId: string,
    workspaceId: string,
    context: SubscribedQueryContext<R>,
  ) => Promise<QueryResult<R>>;

  unsubscribeWorkspaceQuery: (
    accountId: string,
    workspaceId: string,
    queryKey: string[],
  ) => Promise<void>;

  executeMutation: <T extends MutationInput>(
    input: T,
  ) => Promise<MutationMap[T['type']]['output']>;

  executeQuery: <T extends QueryInput>(
    id: string,
    input: T,
  ) => Promise<QueryMap[T['type']]['output']>;

  unsubscribeQuery: (id: string) => Promise<void>;
}

declare global {
  interface Window {
    neuron: NeuronApi;
    eventBus: EventBus;
  }
}
