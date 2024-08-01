import { contextBridge, ipcRenderer } from 'electron';
import {Account} from "@/types/accounts";
import {Workspace} from "@/types/workspaces";
import {Transaction} from "@/types/transactions";

contextBridge.exposeInMainWorld('globalDb', {
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  addAccount: (account: Account) => ipcRenderer.invoke('add-account', account),
  getWorkspaces: () => ipcRenderer.invoke('get-workspaces'),
  addWorkspace: (workspace: Workspace) => ipcRenderer.invoke('add-workspace', workspace),
  enqueueTransaction: (transaction: Transaction) => ipcRenderer.invoke('enqueue-transaction', transaction),
});
