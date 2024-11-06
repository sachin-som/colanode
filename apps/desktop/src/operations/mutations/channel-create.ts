export type ChannelCreateMutationInput = {
  type: 'channel_create';
  userId: string;
  spaceId: string;
  name: string;
};

export type ChannelCreateMutationOutput = {
  id: string;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    channel_create: {
      input: ChannelCreateMutationInput;
      output: ChannelCreateMutationOutput;
    };
  }
}
