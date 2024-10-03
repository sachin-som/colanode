import { EditorCommand } from '@/types/editor';

export const BlockquoteCommand: EditorCommand = {
  key: 'blockquote',
  name: 'Blockquote',
  description: 'Insert a blockquote',
  keywords: ['blockquote', 'quote'],
  icon: 'double-quotes-r',
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

