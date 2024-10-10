export type NodeCollaboratorServerCreateMutationInput = {
  type: 'node_collaborator_server_create';
  accountId: string;
  workspaceId: string;
  nodeId: string;
  collaboratorId: string;
  role: string;
  createdAt: string;
  createdBy: string;
  versionId: string;
  serverCreatedAt: string;
};

export type NodeCollaboratorServerCreateMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    node_collaborator_server_create: {
      input: NodeCollaboratorServerCreateMutationInput;
      output: NodeCollaboratorServerCreateMutationOutput;
    };
  }
}
