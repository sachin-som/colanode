export type TableViewCreateMutationInput = {
  type: 'table_view_create';
  userId: string;
  databaseId: string;
  name: string;
};

export type TableViewCreateMutationOutput = {
  id: string;
};

declare module '@/types/mutations' {
  interface MutationMap {
    table_view_create: {
      input: TableViewCreateMutationInput;
      output: TableViewCreateMutationOutput;
    };
  }
}
