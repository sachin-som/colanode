import { InteractionAttributes, NodeType } from '@colanode/core';

export type Interaction = {
  userId: string;
  nodeId: string;
  nodeType: NodeType;
  attributes: InteractionAttributes;
  createdAt: Date;
  updatedAt: Date | null;
  serverCreatedAt: Date | null;
  serverUpdatedAt: Date | null;
  version: bigint | null;
};
