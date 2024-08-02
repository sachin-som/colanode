import { EditorCommand } from '@/types/editor';

export const DividerCommand: EditorCommand = {
  key: 'divider',
  name: 'Divider',
  description: 'Insert a divider',
  keywords: ['divider', 'break', 'hr'],
  icon: 'page-separator',
  disabled: false,
  handler: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).setHorizontalRule().run();
  },
};

