export type SpaceCreateMutationInput = {
  type: 'space_create';
  userId: string;
  name: string;
  description: string;
};

export type SpaceCreateMutationOutput = {
  id: string;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    space_create: {
      input: SpaceCreateMutationInput;
      output: SpaceCreateMutationOutput;
    };
  }
}
