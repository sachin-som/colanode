import { EditorCommand } from '@/types/editor';

export const Heading1Command: EditorCommand = {
  key: 'heading1',
  name: 'Heading 1',
  description: 'Insert a heading 1 element',
  keywords: ['heading', 'heading2', 'h1'],
  icon: 'h-1',
  disabled: false,
  handler: ({ editor, range }) => {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .setNode('heading', { level: 1 })
      .run();
  },
};
