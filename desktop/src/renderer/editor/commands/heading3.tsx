import { EditorCommand } from '@/types/editor';

export const Heading3Command: EditorCommand = {
  key: 'heading3',
  name: 'Heading 3',
  description: 'Insert a heading 3 element',
  keywords: ['heading', 'heading3', 'h3'],
  icon: 'h-3',
  disabled: false,
  handler: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).setNode('heading3').run();
  },
};
