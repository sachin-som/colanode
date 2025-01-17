export type FileOpenCommandInput = {
  type: 'file_open';
  accountId: string;
  workspaceId: string;
  fileId: string;
  extension: string;
};

declare module '@/shared/commands' {
  interface CommandMap {
    file_open: {
      input: FileOpenCommandInput;
      output: void;
    };
  }
}
