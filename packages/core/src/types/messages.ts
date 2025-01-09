import { Block } from '../registry/block';

export enum MessageType {
  Standard = 1,
}

export type StandardMessageAttributes = {
  type: MessageType.Standard;
  blocks: Record<string, Block>;
  referenceId?: string | null;
};

export type MessageAttributes = StandardMessageAttributes;
