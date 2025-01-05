import { LoginOutput } from '@colanode/core';

export type EmailRegisterMutationInput = {
  type: 'email_register';
  server: string;
  name: string;
  email: string;
  password: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    email_register: {
      input: EmailRegisterMutationInput;
      output: LoginOutput;
    };
  }
}
