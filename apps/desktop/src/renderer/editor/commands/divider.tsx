import { EditorCommand } from '@/types/editor';
import { SeparatorHorizontal } from 'lucide-react';

export const DividerCommand: EditorCommand = {
  key: 'divider',
  name: 'Divider',
  description: 'Insert a divider',
  keywords: ['divider', 'break', 'hr'],
  icon: SeparatorHorizontal,
  disabled: false,
  handler: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).setHorizontalRule().run();
  },
};
