import React from 'react';
import { defaultClasses } from '@/editor/classes';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { LocalNodeWithAttributesAndChildren } from '@/types/nodes';

interface BlockquoteRendererProps {
  node: LocalNodeWithAttributesAndChildren;
  keyPrefix: string | null;
}

const BlockquoteRenderer = ({ node, keyPrefix }: BlockquoteRendererProps) => {
  return (
    <blockquote className={defaultClasses.blockquote}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </blockquote>
  );
};

export { BlockquoteRenderer };
