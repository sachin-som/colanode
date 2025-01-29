import { WorkspaceMetadata } from '@/shared/types/workspaces';

export type WorkspaceMetadataListQueryInput = {
  type: 'workspace_metadata_list';
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    workspace_metadata_list: {
      input: WorkspaceMetadataListQueryInput;
      output: WorkspaceMetadata[];
    };
  }
}
