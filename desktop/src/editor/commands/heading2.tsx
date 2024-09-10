import { EditorCommand } from '@/types/editor';

export const Heading2Command: EditorCommand = {
  key: 'heading2',
  name: 'Heading 2',
  description: 'Insert a heading 2 element',
  keywords: ['heading', 'heading2', 'h2'],
  icon: 'h-2',
  disabled: false,
  handler: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).setNode('heading2').run();
  },
};
