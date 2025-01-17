export type DatabaseDeleteMutationInput = {
  type: 'database_delete';
  accountId: string;
  workspaceId: string;
  databaseId: string;
};

export type DatabaseDeleteMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    database_delete: {
      input: DatabaseDeleteMutationInput;
      output: DatabaseDeleteMutationOutput;
    };
  }
}
