import React from 'react';
import { defaultClasses } from '@/editor/classes';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { LocalNodeWithChildren } from '@/types/nodes';

interface BlockquoteRendererProps {
  node: LocalNodeWithChildren;
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
