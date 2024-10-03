import React from 'react';
import { defaultClasses } from '@/renderer/editor/classes';
import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';
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
