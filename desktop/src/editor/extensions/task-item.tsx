import TaskItem from '@tiptap/extension-task-item';

import { defaultClasses } from '@/editor/classes';

export const TaskItemNode = TaskItem.configure({
  HTMLAttributes: {
    class: defaultClasses.taskItem,
  },
});
