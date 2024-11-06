import { ElectronAPI } from '@electron-toolkit/preload';
import { EventBus } from '@/lib/event-bus';
import { MutationMap, MutationInput } from '@/operations/mutations';
import { QueryMap, QueryInput } from '@/operations/queries';
import { FileMetadata } from '@/types/files';

interface NeuronApi {
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

  openFileDialog: (
    options: Electron.OpenDialogOptions
  ) => Promise<Electron.OpenDialogReturnValue>;

  openFile: (userId: string, id: string, extension: string) => Promise<void>;
  getFileMetadata: (path: string) => Promise<FileMetadata | null>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    neuron: NeuronApi;
    eventBus: EventBus;
  }
}
