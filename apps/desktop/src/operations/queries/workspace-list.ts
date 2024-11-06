import { Workspace } from '@/types/workspaces';

export type WorkspaceListQueryInput = {
  type: 'workspace_list';
};

declare module '@/operations/queries' {
  interface QueryMap {
    workspace_list: {
      input: WorkspaceListQueryInput;
      output: Workspace[];
    };
  }
}
