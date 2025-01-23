import { MessageReactionCount } from '@/shared/types/messages';

export type MessageReactionsAggregateQueryInput = {
  type: 'message_reactions_aggregate';
  messageId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    message_reactions_aggregate: {
      input: MessageReactionsAggregateQueryInput;
      output: MessageReactionCount[];
    };
  }
}
