import {Workspace} from "@/types/workspaces";

export interface GlobalDbApi {
  getWorkspaces: () => Promise<Workspace[]>
  addWorkspace: (workspace: Workspace) => Promise<void>
}

declare global {
  interface Window {
    globalDb: GlobalDbApi;
  }
}