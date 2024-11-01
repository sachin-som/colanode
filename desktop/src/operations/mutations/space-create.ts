export type SpaceCreateMutationInput = {
  type: 'space_create';
  userId: string;
  workspaceId: string;
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
