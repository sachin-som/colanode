import { contextBridge, ipcRenderer } from 'electron';
import {Workspace} from "@/types/workspaces";

contextBridge.exposeInMainWorld('globalDb', {
  getWorkspaces: () => ipcRenderer.invoke('get-workspaces'),
  addWorkspace: (workspace: Workspace) => ipcRenderer.invoke('add-workspace', workspace),
});
