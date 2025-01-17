export type MessageReactionCreateMutationInput = {
  type: 'message_reaction_create';
  accountId: string;
  workspaceId: string;
  messageId: string;
  rootId: string;
  reaction: string;
};

export type MessageReactionCreateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    message_reaction_create: {
      input: MessageReactionCreateMutationInput;
      output: MessageReactionCreateMutationOutput;
    };
  }
}
