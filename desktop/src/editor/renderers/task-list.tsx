import React from 'react';
import { defaultClasses } from '@/editor/classes';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { LocalNodeWithChildren } from '@/types/nodes';

interface TaskListRendererProps {
  node: LocalNodeWithChildren;
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
