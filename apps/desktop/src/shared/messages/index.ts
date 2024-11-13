export interface MessageMap {}

export type MessageInput = MessageMap[keyof MessageMap];

export type MessageContext = {
  accountId: string;
  deviceId: string;
};

export interface MessageHandler<T extends MessageInput> {
  handleMessage: (context: MessageContext, input: T) => Promise<void>;
}
