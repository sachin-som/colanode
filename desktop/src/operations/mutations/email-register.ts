export type EmailRegisterMutationInput = {
  type: 'email_register';
  server: string;
  name: string;
  email: string;
  password: string;
};

export type EmailRegisterMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    email_register: {
      input: EmailRegisterMutationInput;
      output: EmailRegisterMutationOutput;
    };
  }
}
