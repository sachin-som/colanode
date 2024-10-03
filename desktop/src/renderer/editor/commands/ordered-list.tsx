import { EditorCommand } from '@/types/editor';

export const OrderedListCommand: EditorCommand = {
  key: 'ordered-list',
  name: 'Ordered List',
  description: 'Insert a numbered list',
  keywords: ['numberedlist', 'numbered', 'ordered', 'list'],
  icon: 'list-ordered',
  disabled: false,
  handler: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).toggleOrderedList().run();
  },
};
