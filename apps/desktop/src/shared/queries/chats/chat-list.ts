import { ChatEntry } from '@colanode/core';

export type ChatListQueryInput = {
  type: 'chat_list';
  page: number;
  count: number;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    chat_list: {
      input: ChatListQueryInput;
      output: ChatEntry[];
    };
  }
}
