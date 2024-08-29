import { Editor, type Range } from '@tiptap/core';
import { NodeBlock } from '@/types/nodes';

export type EditorCommandProps = {
  editor: Editor;
  range: Range;
  context: EditorCommandContext | null;
};

export type EditorCommandContext = {};

export type EditorCommand = {
  key: string;
  name: string;
  description: string;
  keywords?: string[];
  icon: string;
  handler: (props: EditorCommandProps) => void;
  disabled?: boolean;
};

export type EditorNode = {
  id: string;
  parentId: string;
  type: string;
  index: string | null;
  attrs: Record<string, any> | null;
  content: NodeBlock[] | null;
};
