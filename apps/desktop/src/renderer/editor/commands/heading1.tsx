import { EditorCommand } from '@/shared/types/editor';
import { Heading1 } from 'lucide-react';

export const Heading1Command: EditorCommand = {
  key: 'heading1',
  name: 'Heading 1',
  description: 'Insert a heading 1 element',
  keywords: ['heading', 'heading2', 'h1'],
  icon: Heading1,
  disabled: false,
  handler: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).setNode('heading1').run();
  },
};
