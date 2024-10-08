export type WorkspaceCreateMutationInput = {
  type: 'workspace_create';
  name: string;
  description: string;
  accountId: string;
  avatar: string | null;
};

export type WorkspaceCreateMutationOutput = {
  id: string;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    workspace_create: {
      input: WorkspaceCreateMutationInput;
      output: WorkspaceCreateMutationOutput;
    };
  }
}
