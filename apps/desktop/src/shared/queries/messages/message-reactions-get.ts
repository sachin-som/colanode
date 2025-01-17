import { MessageReactionsCount } from '@/shared/types/messages';

export type MessageReactionsGetQueryInput = {
  type: 'message_reactions_get';
  messageId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    message_reactions_get: {
      input: MessageReactionsGetQueryInput;
      output: MessageReactionsCount[];
    };
  }
}
