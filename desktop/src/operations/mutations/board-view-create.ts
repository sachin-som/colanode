export type BoardViewCreateMutationInput = {
  type: 'board_view_create';
  userId: string;
  databaseId: string;
  name: string;
  groupBy: string;
};

export type BoardViewCreateMutationOutput = {
  id: string;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    board_view_create: {
      input: BoardViewCreateMutationInput;
      output: BoardViewCreateMutationOutput;
    };
  }
}
