export type ServerChangeResultMessageInput = {
  type: 'server_change_result';
  changeId: string;
  success: boolean;
};

declare module '@/operations/messages' {
  interface MessageMap {
    server_change_result: ServerChangeResultMessageInput;
  }
}
