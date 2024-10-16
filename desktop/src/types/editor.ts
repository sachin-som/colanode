import { Editor, type Range } from '@tiptap/core';
import { LocalNodeAttributes } from '@/types/nodes';

export type EditorCommandProps = {
  editor: Editor;
  range: Range;
  context: EditorCommandContext | null;
};

export type EditorCommandContext = {
  documentId: string;
  userId: string;
};

export type EditorCommand = {
  key: string;
  name: string;
  description: string;
  keywords?: string[];
  icon: string;
  handler: (props: EditorCommandProps) => void | Promise<void>;
  disabled?: boolean;
};

export type EditorNode = {
  id: string;
  attributes: LocalNodeAttributes;
};
