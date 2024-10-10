export type NodeCollaboratorServerDeleteMutationInput = {
  type: 'node_collaborator_server_delete';
  accountId: string;
  workspaceId: string;
  nodeId: string;
  collaboratorId: string;
};

export type NodeCollaboratorServerDeleteMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    node_collaborator_server_delete: {
      input: NodeCollaboratorServerDeleteMutationInput;
      output: NodeCollaboratorServerDeleteMutationOutput;
    };
  }
}
