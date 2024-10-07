import { EventBus } from '@/lib/event-bus';
import { CompiledQuery, QueryResult } from 'kysely';
import { LocalMutationInput } from '@/operations/mutations';
import { SubscribedQueryContext } from '@/operations/queries';
import { MutationMap, MutationInput } from '@/operations/mutations';
import { QueryMap, QueryInput } from '@/operations/queries';

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

  openFileDialog: (
    options: Electron.OpenDialogOptions,
  ) => Promise<Electron.OpenDialogReturnValue>;
}

declare global {
  interface Window {
    neuron: NeuronApi;
    eventBus: EventBus;
  }
}
