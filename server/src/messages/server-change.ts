import { ServerChange } from '@/types/sync';

export type ServerChangeMessageInput = {
  type: 'server_change';
  change: ServerChange;
};

declare module '@/messages' {
  interface MessageMap {
    server_change: ServerChangeMessageInput;
  }
}
