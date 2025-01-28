export type SpaceAvatarUpdateMutationInput = {
  type: 'space_avatar_update';
  accountId: string;
  workspaceId: string;
  spaceId: string;
  avatar: string;
};

export type SpaceAvatarUpdateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    space_avatar_update: {
      input: SpaceAvatarUpdateMutationInput;
      output: SpaceAvatarUpdateMutationOutput;
    };
  }
}
