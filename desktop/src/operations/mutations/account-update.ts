export type AccountUpdateMutationInput = {
  type: 'account_update';
  id: string;
  name: string;
  avatar: string | null;
};

export type AccountUpdateMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    account_update: {
      input: AccountUpdateMutationInput;
      output: AccountUpdateMutationOutput;
    };
  }
}
