export type NodeCollaboratorSyncMutationInput = {
  type: 'node_collaborator_sync';
  accountId: string;
  workspaceId: string;
  id: string;
  action: string;
  before: any;
  after: any;
};

export type NodeCollaboratorSyncMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    node_collaborator_sync: {
      input: NodeCollaboratorSyncMutationInput;
      output: NodeCollaboratorSyncMutationOutput;
    };
  }
}
