export interface MessageMap {}

export type MessageInput = MessageMap[keyof MessageMap];

export interface MessageHandler<T extends MessageInput> {
  handleMessage: (input: T) => Promise<void>;
}
