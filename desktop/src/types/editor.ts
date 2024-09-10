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
  type: string;
  parentId: string;
  index: string;
  attributes: EditorNodeAttribute[];
  content: NodeBlock[] | null;
};

export type EditorNodeAttribute = {
  nodeId: string;
  type: string;
  key: string;
  textValue: string | null;
  numberValue: number | null;
  foreignNodeId: string | null;
};
