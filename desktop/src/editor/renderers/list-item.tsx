import React from 'react';
import { defaultClasses } from '@/editor/classes';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { NodeTree } from '@/types/nodes';

interface ListItemRendererProps {
  node: NodeTree;
  keyPrefix: string | null;
}

export const ListItemRenderer = ({
  node,
  keyPrefix,
}: ListItemRendererProps) => {
  return (
    <li className={defaultClasses.listItem}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </li>
  );
};
