export type WorkspaceCreateMutationInput = {
  type: 'workspace_create';
  name: string;
  description: string;
  accountId: string;
};

export type WorkspaceCreateMutationOutput = {
  id: string;
};

declare module '@/types/mutations' {
  interface MutationMap {
    workspace_create: {
      input: WorkspaceCreateMutationInput;
      output: WorkspaceCreateMutationOutput;
    };
  }
}
