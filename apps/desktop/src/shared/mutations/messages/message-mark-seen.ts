export type MessageMarkSeenMutationInput = {
  type: 'message_mark_seen';
  userId: string;
  messageId: string;
};

export type MessageMarkSeenMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    message_mark_seen: {
      input: MessageMarkSeenMutationInput;
      output: MessageMarkSeenMutationOutput;
    };
  }
}
