import { defaultClasses } from '@/renderer/editor/classes';
import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';
import { JSONContent } from '@tiptap/core';

interface TaskListRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const TaskListRenderer = ({
  node,
  keyPrefix,
}: TaskListRendererProps) => {
  return (
    <ul className={defaultClasses.taskList}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </ul>
  );
};
