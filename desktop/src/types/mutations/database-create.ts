export type DatabaseCreateMutationInput = {
  type: 'database_create';
  userId: string;
  spaceId: string;
  name: string;
};

export type DatabaseCreateMutationOutput = {
  id: string;
};

declare module '@/types/mutations' {
  interface MutationMap {
    database_create: {
      input: DatabaseCreateMutationInput;
      output: DatabaseCreateMutationOutput;
    };
  }
}
