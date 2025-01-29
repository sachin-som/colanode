export type WorkspaceMetadataSaveMutationInput = {
  type: 'workspace_metadata_save';
  accountId: string;
  workspaceId: string;
  key: string;
  value: string;
};

export type WorkspaceMetadataSaveMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    workspace_metadata_save: {
      input: WorkspaceMetadataSaveMutationInput;
      output: WorkspaceMetadataSaveMutationOutput;
    };
  }
}
