import { EditorCommand } from '@/types/editor';
import { ListTodo } from 'lucide-react';

export const TodoCommand: EditorCommand = {
  key: 'todo',
  name: 'To-do',
  description: 'Insert a to-do item',
  keywords: ['to-do', 'todo', 'checklist', 'action', 'task'],
  icon: ListTodo,
  disabled: false,
  handler: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).toggleTaskList().run();
  },
};
