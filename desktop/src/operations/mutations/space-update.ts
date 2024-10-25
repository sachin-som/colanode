export type SpaceUpdateMutationInput = {
  type: 'space_update';
  userId: string;
  id: string;
  name: string;
  description: string;
  avatar: string;
};

export type SpaceUpdateMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    space_update: {
      input: SpaceUpdateMutationInput;
      output: SpaceUpdateMutationOutput;
    };
  }
}
