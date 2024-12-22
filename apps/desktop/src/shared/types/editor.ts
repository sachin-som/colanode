import { Editor, type Range } from '@tiptap/core';
import { FC } from 'react';

export type EditorCommandProps = {
  editor: Editor;
  range: Range;
  context: EditorCommandContext | null;
};

export type EditorCommandContext = {
  documentId: string;
  userId: string;
  rootId: string;
};

export type EditorCommand = {
  key: string;
  name: string;
  description: string;
  keywords?: string[];
  icon: FC<React.SVGProps<SVGSVGElement>>;
  handler: (props: EditorCommandProps) => void | Promise<void>;
  disabled?: boolean;
};
