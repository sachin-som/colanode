export type SpaceUpdateMutationInput = {
  type: 'space_update';
  accountId: string;
  workspaceId: string;
  id: string;
  name: string;
  description: string;
  avatar?: string | null;
};

export type SpaceUpdateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    space_update: {
      input: SpaceUpdateMutationInput;
      output: SpaceUpdateMutationOutput;
    };
  }
}
