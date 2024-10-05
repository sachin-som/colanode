export type ServerCreateMutationInput = {
  type: 'server_create';
  domain: string;
};

export type ServerCreateMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    server_create: {
      input: ServerCreateMutationInput;
      output: ServerCreateMutationOutput;
    };
  }
}
