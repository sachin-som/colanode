export type FileMarkOpenedMutationInput = {
  type: 'file_mark_opened';
  userId: string;
  fileId: string;
};

export type FileMarkOpenedMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    file_mark_opened: {
      input: FileMarkOpenedMutationInput;
      output: FileMarkOpenedMutationOutput;
    };
  }
}
