import { EditorCommand } from '@/types/editor';
import { Quote } from 'lucide-react';

export const BlockquoteCommand: EditorCommand = {
  key: 'blockquote',
  name: 'Blockquote',
  description: 'Insert a blockquote',
  keywords: ['blockquote', 'quote'],
  icon: Quote,
  disabled: false,
  handler: ({ editor, range }) => {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .toggleNode('paragraph', 'paragraph')
      .toggleBlockquote()
      .run();
  },
};
