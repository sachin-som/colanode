export type FileDialogOpenCommandInput = {
  type: 'file_dialog_open';
  options: Electron.OpenDialogOptions;
};

declare module '@/shared/commands' {
  interface CommandMap {
    file_dialog_open: {
      input: FileDialogOpenCommandInput;
      output: Electron.OpenDialogReturnValue;
    };
  }
}
