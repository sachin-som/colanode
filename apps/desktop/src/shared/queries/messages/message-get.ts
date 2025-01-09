import { MessageNode } from '@/shared/types/messages';

export type MessageGetQueryInput = {
  type: 'message_get';
  messageId: string;
  userId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    message_get: {
      input: MessageGetQueryInput;
      output: MessageNode | null;
    };
  }
}
