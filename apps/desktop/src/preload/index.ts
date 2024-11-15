import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { eventBus } from '@/shared/lib/event-bus';
import { MutationInput, MutationMap } from '@/shared/mutations';
import { QueryInput, QueryMap } from '@/shared/queries';
import { Event } from '@/shared/types/events';
import { CommandMap } from '@/shared/commands';
import { CommandInput } from '@/shared/commands';

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('colanode', {
      init: () => ipcRenderer.invoke('init'),
      logout: (accountId: string) => ipcRenderer.invoke('logout', accountId),

      executeMutation: <T extends MutationInput>(
        input: T
      ): Promise<MutationMap[T['type']]['output']> => {
        return ipcRenderer.invoke('execute-mutation', input);
      },

      executeQuery: <T extends QueryInput>(
        input: T
      ): Promise<QueryMap[T['type']]['output']> => {
        return ipcRenderer.invoke('execute-query', input);
      },

      executeQueryAndSubscribe: <T extends QueryInput>(
        id: string,
        input: T
      ): Promise<QueryMap[T['type']]['output']> => {
        return ipcRenderer.invoke('execute-query-and-subscribe', id, input);
      },

      unsubscribeQuery: (id: string): Promise<void> => {
        return ipcRenderer.invoke('unsubscribe-query', id);
      },

      executeCommand: <T extends CommandInput>(
        input: T
      ): Promise<CommandMap[T['type']]['output']> => {
        return ipcRenderer.invoke('execute-command', input);
      },
    });

    contextBridge.exposeInMainWorld('eventBus', {
      subscribe: (callback: (event: Event) => void) =>
        eventBus.subscribe(callback),
      unsubscribe: (id: string) => eventBus.unsubscribe(id),
      publish: (event: Event) => eventBus.publish(event),
    });

    ipcRenderer.on('event', (_, event) => {
      eventBus.publish(event);
    });
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
