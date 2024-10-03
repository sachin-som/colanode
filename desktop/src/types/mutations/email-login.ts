export type EmailLoginMutationInput = {
  type: 'email_login';
  server: string;
  email: string;
  password: string;
};

export type EmailLoginMutationOutput = {
  success: boolean;
};

declare module '@/types/mutations' {
  interface MutationMap {
    email_login: {
      input: EmailLoginMutationInput;
      output: EmailLoginMutationOutput;
    };
  }
}
