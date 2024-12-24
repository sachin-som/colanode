import { InteractionAttributes } from '@colanode/core';

export type Interaction = {
  userId: string;
  entryId: string;
  attributes: InteractionAttributes;
  createdAt: Date;
  updatedAt: Date | null;
  serverCreatedAt: Date | null;
  serverUpdatedAt: Date | null;
  version: bigint | null;
};
