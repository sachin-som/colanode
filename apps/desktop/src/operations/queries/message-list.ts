import { MessageNode } from '@/types/messages';

export type MessageListQueryInput = {
  type: 'message_list';
  conversationId: string;
  page: number;
  count: number;
  userId: string;
};

declare module '@/operations/queries' {
  interface QueryMap {
    message_list: {
      input: MessageListQueryInput;
      output: MessageNode[];
    };
  }
}
