import { WorkspaceRole } from '@colanode/core';

export type UsersInviteMutationInput = {
  type: 'users_invite';
  emails: string[];
  userId: string;
  role: WorkspaceRole;
};

export type UsersInviteMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    users_invite: {
      input: UsersInviteMutationInput;
      output: UsersInviteMutationOutput;
    };
  }
}
