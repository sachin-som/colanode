export type NodeCollaboratorServerUpdateMutationInput = {
  type: 'node_collaborator_server_update';
  accountId: string;
  workspaceId: string;
  nodeId: string;
  collaboratorId: string;
  role: string;
  updatedAt: string;
  updatedBy: string;
  versionId: string;
  serverUpdatedAt: string;
};

export type NodeCollaboratorServerUpdateMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    node_collaborator_server_update: {
      input: NodeCollaboratorServerUpdateMutationInput;
      output: NodeCollaboratorServerUpdateMutationOutput;
    };
  }
}
