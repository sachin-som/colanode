export type PageCreateMutationInput = {
  type: 'page_create';
  userId: string;
  parentId: string;
  name: string;
  generateIndex: boolean;
};

export type PageCreateMutationOutput = {
  id: string;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    page_create: {
      input: PageCreateMutationInput;
      output: PageCreateMutationOutput;
    };
  }
}
