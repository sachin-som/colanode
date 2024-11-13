export type ServerNodeDeleteMutationInput = {
  type: 'server_node_delete';
  accountId: string;
  id: string;
  workspaceId: string;
};

export type ServerNodeDeleteMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    server_node_delete: {
      input: ServerNodeDeleteMutationInput;
      output: ServerNodeDeleteMutationOutput;
    };
  }
}
