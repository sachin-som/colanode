export type ServerChangeResultMessageInput = {
  type: 'server_change_result';
  changeId: string;
  success: boolean;
};
