export type FileMarkSeenMutationInput = {
  type: 'file_mark_seen';
  accountId: string;
  workspaceId: string;
  fileId: string;
};

export type FileMarkSeenMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    file_mark_seen: {
      input: FileMarkSeenMutationInput;
      output: FileMarkSeenMutationOutput;
    };
  }
}
