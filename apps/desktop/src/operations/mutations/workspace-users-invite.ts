export type WorkspaceUsersInviteMutationInput = {
  type: 'workspace_users_invite';
  emails: string[];
  userId: string;
};

export type WorkspaceUsersInviteMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    workspace_users_invite: {
      input: WorkspaceUsersInviteMutationInput;
      output: WorkspaceUsersInviteMutationOutput;
    };
  }
}
