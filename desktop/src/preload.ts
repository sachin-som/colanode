import { contextBridge, ipcRenderer } from 'electron';
import { Account } from '@/types/accounts';
import { Workspace } from '@/types/workspaces';
import { Transaction } from '@/types/transactions';
import { CreateNodeInput, Node } from '@/types/nodes';

contextBridge.exposeInMainWorld('globalDb', {
  init: () => ipcRenderer.invoke('init'),
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  addAccount: (account: Account) => ipcRenderer.invoke('add-account', account),
  getWorkspaces: () => ipcRenderer.invoke('get-workspaces'),
  addWorkspace: (workspace: Workspace) =>
    ipcRenderer.invoke('add-workspace', workspace),
  addTransaction: (transaction: Transaction) =>
    ipcRenderer.invoke('add-transaction', transaction),
});

contextBridge.exposeInMainWorld('workspaceDb', {
  createNode: (accountId: string, workspaceId: string, node: CreateNodeInput) =>
    ipcRenderer.invoke('create-node', accountId, workspaceId, node),
  createNodes: (accountId: string, workspaceId: string, nodes: CreateNodeInput[]) =>
    ipcRenderer.invoke('create-nodes', accountId, workspaceId, nodes),
  getNodes: (accountId: string, workspaceId: string) =>
    ipcRenderer.invoke('get-nodes', accountId, workspaceId),
  updateNode: (accountId: string, workspaceId: string, node: Node) =>
    ipcRenderer.invoke('update-node', accountId, workspaceId, node),
  deleteNode: (accountId: string, workspaceId: string, nodeId: string) =>
    ipcRenderer.invoke('delete-node', accountId, workspaceId, nodeId),

  getConversationNodes: (accountId: string, workspaceId: string, conversationId: string, count: number, after?: string | null) => 
    ipcRenderer.invoke('get-conversation-nodes', accountId, workspaceId, conversationId, count, after),
});
