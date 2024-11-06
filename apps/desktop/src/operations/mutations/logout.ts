export type LogoutMutationInput = {
  type: 'logout';
  accountId: string;
};

export type LogoutMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    logout: {
      input: LogoutMutationInput;
      output: LogoutMutationOutput;
    };
  }
}
