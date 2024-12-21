import { Message } from '@colanode/core';

export type ConnectedUser = {
  userId: string;
  workspaceId: string;
  accountId: string;
  deviceId: string;
  sendMessage: (message: Message) => void;
};
