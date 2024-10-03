import { EditorCommand } from '@/types/editor';

export const CodeBlockCommand: EditorCommand = {
  key: 'code-block',
  name: 'Code',
  description: 'Insert a code block',
  keywords: ['code', 'codeblock'],
  icon: 'code-s-slash-line',
  disabled: false,
  handler: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
  },
};

