import { MessageReaction } from '@/shared/types/messages';

export type MessageReactionListQueryInput = {
  type: 'message_reaction_list';
  messageId: string;
  reaction: string;
  accountId: string;
  workspaceId: string;
  page: number;
  count: number;
};

declare module '@/shared/queries' {
  interface QueryMap {
    message_reaction_list: {
      input: MessageReactionListQueryInput;
      output: MessageReaction[];
    };
  }
}
