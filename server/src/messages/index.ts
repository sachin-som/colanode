export interface MessageMap {}

export type MessageInput = MessageMap[keyof MessageMap];

export type MessageContext = {
  accountId: string;
  deviceId: string;
};
