export type FileOpenCommandInput = {
  type: 'file_open';
  userId: string;
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
