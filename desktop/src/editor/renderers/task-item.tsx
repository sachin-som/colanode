import React from 'react';
import { defaultClasses } from '@/editor/classes';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { NodeWithChildren } from '@/types/nodes';

interface TaskItemRendererProps {
  node: NodeWithChildren;
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
