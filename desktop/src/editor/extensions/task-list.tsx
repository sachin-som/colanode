import TaskList from '@tiptap/extension-task-list';

import { defaultClasses } from '@/editor/classes';

export const TaskListNode = TaskList.configure({
  HTMLAttributes: {
    class: defaultClasses.taskList,
  },
});
