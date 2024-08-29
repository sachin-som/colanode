import { EditorCommand } from '@/types/editor';

export const TodoCommand: EditorCommand = {
  key: 'todo',
  name: 'To-do',
  description: 'Insert a to-do item',
  keywords: ['to-do', 'todo', 'checklist', 'action', 'task'],
  icon: 'task-line',
  disabled: false,
  handler: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).toggleTaskList().run();
  },
};
