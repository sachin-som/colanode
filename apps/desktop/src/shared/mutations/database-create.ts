export type DatabaseCreateMutationInput = {
  type: 'database_create';
  userId: string;
  spaceId: string;
  name: string;
};

export type DatabaseCreateMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    database_create: {
      input: DatabaseCreateMutationInput;
      output: DatabaseCreateMutationOutput;
    };
  }
}
