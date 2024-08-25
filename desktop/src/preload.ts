import { contextBridge, ipcRenderer } from 'electron';
import { eventBus, Event } from '@/lib/event-bus';
import { CompiledQuery, QueryResult } from 'kysely';
import { LocalMutation } from '@/types/mutations';

contextBridge.exposeInMainWorld('neuron', {
  init: () => ipcRenderer.invoke('init'),
  logout: (accountId: string) => ipcRenderer.invoke('logout', accountId),
  executeAppQuery: <R>(query: CompiledQuery<R>): Promise<QueryResult<R>> =>
    ipcRenderer.invoke('execute-app-query', query),
  executeAppQueryAndSubscribe: <R>(
    queryId: string,
    query: CompiledQuery<R>,
  ): Promise<QueryResult<R>> =>
    ipcRenderer.invoke('execute-app-query-and-subscribe', queryId, query),

  executeAppMutation: (mutation: CompiledQuery): Promise<void> =>
    ipcRenderer.invoke('execute-app-mutation', mutation),

  unsubscribeAppQuery: (queryId: string): Promise<void> =>
    ipcRenderer.invoke('unsubscribe-app-query', queryId),

  executeWorkspaceMutation: (
    accountId: string,
    workspaceId: string,
    mutation: LocalMutation,
  ): Promise<void> =>
    ipcRenderer.invoke(
      'execute-workspace-mutation',
      accountId,
      workspaceId,
      mutation,
    ),

  executeWorkspaceQuery: <R>(
    accountId: string,
    workspaceId: string,
    query: CompiledQuery<R>,
  ): Promise<QueryResult<R>> =>
    ipcRenderer.invoke(
      'execute-workspace-query',
      accountId,
      workspaceId,
      query,
    ),

  executeWorkspaceQueryAndSubscribe: <R>(
    accountId: string,
    workspaceId: string,
    queryId: string,
    query: CompiledQuery<R>,
  ): Promise<QueryResult<R>> =>
    ipcRenderer.invoke(
      'execute-workspace-query-and-subscribe',
      accountId,
      workspaceId,
      queryId,
      query,
    ),

  unsubscribeWorkspaceQuery: (
    accountId: string,
    workspaceId: string,
    queryId: string,
  ) =>
    ipcRenderer.invoke(
      'unsubscribe-workspace-query',
      accountId,
      workspaceId,
      queryId,
    ),
});

contextBridge.exposeInMainWorld('eventBus', {
  subscribe: (callback: (event: Event) => void) => eventBus.subscribe(callback),
  unsubscribe: (id: string) => eventBus.unsubscribe(id),
  publish: (event: Event) => eventBus.publish(event),
});

ipcRenderer.on('event', (_, event) => {
  eventBus.publish(event);
});
