import { Editor, type Range } from '@tiptap/core';

export type EditorCommandProps = {
  editor: Editor;
  range: Range;
  context: EditorCommandContext | null;
}

export type EditorCommandContext = {

}

export type EditorCommand = {
  key: string;
  name: string;
  description: string;
  keywords?: string[];
  icon: string;
  handler: (props: EditorCommandProps) => void;
  disabled?: boolean;
}
