import { NodeCollaboratorNode } from '@/types/nodes';

export type NodeCollaboratorSearchQueryInput = {
  type: 'node_collaborator_search';
  searchQuery: string;
  excluded: string[];
  userId: string;
};

declare module '@/operations/queries' {
  interface QueryMap {
    node_collaborator_search: {
      input: NodeCollaboratorSearchQueryInput;
      output: NodeCollaboratorNode[];
    };
  }
}
