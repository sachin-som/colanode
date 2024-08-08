import { contextBridge, ipcRenderer } from 'electron';
import { Account } from '@/types/accounts';
import { Workspace } from '@/types/workspaces';
import { Transaction } from '@/types/transactions';
import { CreateNodeInput, UpdateNodeInput } from '@/types/nodes';
import { eventBus, Event } from '@/lib/event-bus';

contextBridge.exposeInMainWorld('globalDb', {
  init: () => ipcRenderer.invoke('init'),
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  addAccount: (account: Account) => ipcRenderer.invoke('add-account', account),
  getWorkspaces: () => ipcRenderer.invoke('get-workspaces'),
  addWorkspace: (workspace: Workspace) =>
    ipcRenderer.invoke('add-workspace', workspace),
  addTransaction: (transaction: Transaction) =>
    ipcRenderer.invoke('add-transaction', transaction),
  logout: (accountId: string) => ipcRenderer.invoke('logout', accountId),
});

contextBridge.exposeInMainWorld('workspaceDb', {
  createNode: (accountId: string, workspaceId: string, node: CreateNodeInput) =>
    ipcRenderer.invoke('create-node', accountId, workspaceId, node),
  createNodes: (
    accountId: string,
    workspaceId: string,
    nodes: CreateNodeInput[],
  ) => ipcRenderer.invoke('create-nodes', accountId, workspaceId, nodes),
  getNodes: (accountId: string, workspaceId: string) =>
    ipcRenderer.invoke('get-nodes', accountId, workspaceId),
  updateNode: (
    accountId: string,
    workspaceId: string,
    input: UpdateNodeInput,
  ) => ipcRenderer.invoke('update-node', accountId, workspaceId, input),
  deleteNode: (accountId: string, workspaceId: string, nodeId: string) =>
    ipcRenderer.invoke('delete-node', accountId, workspaceId, nodeId),
  deleteNodes: (accountId: string, workspaceId: string, nodeIds: string[]) =>
    ipcRenderer.invoke('delete-nodes', accountId, workspaceId, nodeIds),

  getSidebarNodes: (accountId: string, workspaceId: string) =>
    ipcRenderer.invoke('get-sidebar-nodes', accountId, workspaceId),

  getConversationNodes: (
    accountId: string,
    workspaceId: string,
    conversationId: string,
    count: number,
    after?: string | null,
  ) =>
    ipcRenderer.invoke(
      'get-conversation-nodes',
      accountId,
      workspaceId,
      conversationId,
      count,
      after,
    ),

  getDocumentNodes: (
    accountId: string,
    workspaceId: string,
    documentId: string,
  ) =>
    ipcRenderer.invoke(
      'get-document-nodes',
      accountId,
      workspaceId,
      documentId,
    ),

  getContainerNodes: (
    accountId: string,
    workspaceId: string,
    containerId: string,
  ) =>
    ipcRenderer.invoke(
      'get-container-nodes',
      accountId,
      workspaceId,
      containerId,
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
