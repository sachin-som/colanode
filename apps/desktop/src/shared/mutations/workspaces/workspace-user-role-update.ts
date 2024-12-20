export type UserRoleUpdateMutationInput = {
  type: 'user_role_update';
  userToUpdateId: string;
  role: string;
  userId: string;
};

export type UserRoleUpdateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    user_role_update: {
      input: UserRoleUpdateMutationInput;
      output: UserRoleUpdateMutationOutput;
    };
  }
}
