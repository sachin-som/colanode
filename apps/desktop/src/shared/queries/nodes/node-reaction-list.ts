import { NodeReaction } from '@/shared/types/nodes';

export type NodeReactionListQueryInput = {
  type: 'node_reaction_list';
  nodeId: string;
  reaction: string;
  accountId: string;
  workspaceId: string;
  page: number;
  count: number;
};

declare module '@/shared/queries' {
  interface QueryMap {
    node_reaction_list: {
      input: NodeReactionListQueryInput;
      output: NodeReaction[];
    };
  }
}
