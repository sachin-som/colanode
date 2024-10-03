import React from 'react';
import { defaultClasses } from '@/renderer/editor/classes';
import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';
import { LocalNodeWithChildren } from '@/types/nodes';

interface ListItemRendererProps {
  node: LocalNodeWithChildren;
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
