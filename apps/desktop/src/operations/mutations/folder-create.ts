export type FolderCreateMutationInput = {
  type: 'folder_create';
  userId: string;
  parentId: string;
  name: string;
  generateIndex: boolean;
};

export type FolderCreateMutationOutput = {
  id: string;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    folder_create: {
      input: FolderCreateMutationInput;
      output: FolderCreateMutationOutput;
    };
  }
}
