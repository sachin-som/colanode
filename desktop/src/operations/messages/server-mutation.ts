import { ServerMutation } from '@/types/mutations';

export type ServerMutationMessageInput = {
  type: 'server_mutation';
  accountId: string;
  mutation: ServerMutation;
};

declare module '@/operations/messages' {
  interface MessageMap {
    server_mutation: ServerMutationMessageInput;
  }
}
