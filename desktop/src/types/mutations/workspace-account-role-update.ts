export type WorkspaceAccountRoleUpdateMutationInput = {
  type: 'workspace_account_role_update';
  accountId: string;
  role: string;
  userId: string;
};

export type WorkspaceAccountRoleUpdateMutationOutput = {
  success: boolean;
};

declare module '@/types/mutations' {
  interface MutationMap {
    workspace_account_role_update: {
      input: WorkspaceAccountRoleUpdateMutationInput;
      output: WorkspaceAccountRoleUpdateMutationOutput;
    };
  }
}
