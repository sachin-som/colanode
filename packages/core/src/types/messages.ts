import { Block } from '../registry/block';

export type MessageType = 'standard';

export type MessageContent = {
  blocks: Record<string, Block>;
};
