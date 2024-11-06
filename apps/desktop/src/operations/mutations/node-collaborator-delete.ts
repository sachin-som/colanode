export type NodeCollaboratorDeleteMutationInput = {
  type: 'node_collaborator_delete';
  userId: string;
  nodeId: string;
  collaboratorId: string;
};

export type NodeCollaboratorDeleteMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    node_collaborator_delete: {
      input: NodeCollaboratorDeleteMutationInput;
      output: NodeCollaboratorDeleteMutationOutput;
    };
  }
}
