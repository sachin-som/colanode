import React from 'react';
import { defaultClasses } from '@/renderer/editor/classes';
import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';
import { LocalNodeWithChildren } from '@/types/nodes';

interface TaskItemRendererProps {
  node: LocalNodeWithChildren;
  keyPrefix: string | null;
}

export const TaskItemRenderer = ({
  node,
  keyPrefix,
}: TaskItemRendererProps) => {
  return (
    <li className={defaultClasses.taskItem}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </li>
  );
};
