export type ServerChangeAckMessageInput = {
  type: 'server_change_ack';
  changeId: string;
};

declare module '@/operations/messages' {
  interface MessageMap {
    server_change_ack: ServerChangeAckMessageInput;
  }
}
