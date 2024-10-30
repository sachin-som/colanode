import { contextBridge, ipcRenderer } from 'electron';
import { eventBus, Event } from '@/lib/event-bus';
import { MutationInput, MutationMap } from '@/operations/mutations';
import { QueryInput, QueryMap } from '@/operations/queries';

contextBridge.exposeInMainWorld('neuron', {
  init: () => ipcRenderer.invoke('init'),
  logout: (accountId: string) => ipcRenderer.invoke('logout', accountId),

  executeMutation: <T extends MutationInput>(
    input: T,
  ): Promise<MutationMap[T['type']]['output']> => {
    return ipcRenderer.invoke('execute-mutation', input);
  },

  executeQuery: <T extends QueryInput>(
    input: T,
  ): Promise<QueryMap[T['type']]['output']> => {
    return ipcRenderer.invoke('execute-query', input);
  },

  executeQueryAndSubscribe: <T extends QueryInput>(
    id: string,
    input: T,
  ): Promise<QueryMap[T['type']]['output']> => {
    return ipcRenderer.invoke('execute-query-and-subscribe', id, input);
  },

  unsubscribeQuery: (id: string): Promise<void> => {
    return ipcRenderer.invoke('unsubscribe-query', id);
  },

  openFileDialog: (options: Electron.OpenDialogOptions) => {
    return ipcRenderer.invoke('open-file-dialog', options);
  },

  openFile: (userId: string, id: string, extension: string) => {
    return ipcRenderer.invoke('open-file', userId, id, extension);
  },

  getFileMetadata: (path: string) => {
    return ipcRenderer.invoke('get-file-metadata', path);
  },
});

contextBridge.exposeInMainWorld('eventBus', {
  subscribe: (callback: (event: Event) => void) => eventBus.subscribe(callback),
  unsubscribe: (id: string) => eventBus.unsubscribe(id),
  publish: (event: Event) => eventBus.publish(event),
});

ipcRenderer.on('event', (_, event) => {
  eventBus.publish(event);
});
