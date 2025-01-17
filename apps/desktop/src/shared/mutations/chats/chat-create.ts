export type ChatCreateMutationInput = {
  type: 'chat_create';
  accountId: string;
  workspaceId: string;
  userId: string;
};

export type ChatCreateMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    chat_create: {
      input: ChatCreateMutationInput;
      output: ChatCreateMutationOutput;
    };
  }
}
