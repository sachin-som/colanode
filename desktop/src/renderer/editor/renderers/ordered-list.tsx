import React from 'react';
import { defaultClasses } from '@/renderer/editor/classes';
import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';
import { LocalNodeWithChildren } from '@/types/nodes';

interface OrderedListRendererProps {
  node: LocalNodeWithChildren;
  keyPrefix: string | null;
}

export const OrderedListRenderer = ({
  node,
  keyPrefix,
}: OrderedListRendererProps) => {
  return (
    <ol className={defaultClasses.orderedList}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </ol>
  );
};
