import React from 'react';
import { defaultClasses } from '@/editor/classes';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { LocalNodeWithAttributesAndChildren } from '@/types/nodes';

interface OrderedListRendererProps {
  node: LocalNodeWithAttributesAndChildren;
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
