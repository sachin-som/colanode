import { MessageNode } from '@/shared/types/messages';

export type MessageListQueryInput = {
  type: 'message_list';
  conversationId: string;
  page: number;
  count: number;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    message_list: {
      input: MessageListQueryInput;
      output: MessageNode[];
    };
  }
}
