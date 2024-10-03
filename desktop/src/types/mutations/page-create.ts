export type PageCreateMutationInput = {
  type: 'page_create';
  userId: string;
  spaceId: string;
  name: string;
};

export type PageCreateMutationOutput = {
  id: string;
};

declare module '@/types/mutations' {
  interface MutationMap {
    page_create: {
      input: PageCreateMutationInput;
      output: PageCreateMutationOutput;
    };
  }
}
