import { EventBus } from '@/lib/event-bus';
import { CompiledQuery, QueryResult } from 'kysely';
import { LocalMutationInput } from '@/types/mutations';
import { SubscribedQueryContext } from '@/types/queries';
import { MutationMap, MutationInput } from '@/types/mutations';
import { QueryMap, QueryInput } from '@/types/queries';

interface NeuronApi {
  init: () => Promise<void>;
  logout: (accountId: string) => Promise<void>;

  executeMutation: <T extends MutationInput>(
    input: T,
  ) => Promise<MutationMap[T['type']]['output']>;

  executeQuery: <T extends QueryInput>(
    input: T,
  ) => Promise<QueryMap[T['type']]['output']>;

  executeQueryAndSubscribe: <T extends QueryInput>(
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
