import { ElectronAPI } from '@electron-toolkit/preload';
import { EventBus } from '@/lib/event-bus';
import { MutationMap, MutationInput } from '@/shared/mutations';
import { QueryMap, QueryInput } from '@/shared/queries';
import { CommandMap, CommandInput } from '@/shared/commands';

interface ColanodeAPI {
  init: () => Promise<void>;
  logout: (accountId: string) => Promise<void>;

  executeMutation: <T extends MutationInput>(
    input: T
  ) => Promise<MutationMap[T['type']]['output']>;

  executeQuery: <T extends QueryInput>(
    input: T
  ) => Promise<QueryMap[T['type']]['output']>;

  executeQueryAndSubscribe: <T extends QueryInput>(
    id: string,
    input: T
  ) => Promise<QueryMap[T['type']]['output']>;

  unsubscribeQuery: (id: string) => Promise<void>;

  executeCommand: <T extends CommandInput>(
    input: T
  ) => Promise<CommandMap[T['type']]['output']>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    colanode: ColanodeAPI;
    eventBus: EventBus;
  }
}
