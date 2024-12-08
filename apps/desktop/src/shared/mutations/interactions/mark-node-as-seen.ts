import { NodeType } from '@colanode/core';

export type MarkNodeAsSeenMutationInput = {
  type: 'mark_node_as_seen';
  userId: string;
  nodeId: string;
  nodeType: NodeType;
  transactionId: string;
};

export type MarkNodeAsSeenMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    mark_node_as_seen: {
      input: MarkNodeAsSeenMutationInput;
      output: MarkNodeAsSeenMutationOutput;
    };
  }
}
