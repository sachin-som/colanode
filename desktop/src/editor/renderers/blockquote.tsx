import React from 'react';
import { defaultClasses } from '@/editor/classes';
import { NodeContentRenderer } from '@/editor/renderers/node-content';
import { NodeTree } from '@/types/nodes';

interface BlockquoteRendererProps {
  node: NodeTree;
  keyPrefix: string | null;
}

const BlockquoteRenderer = ({ node, keyPrefix }: BlockquoteRendererProps) => {
  return (
    <blockquote className={defaultClasses.blockquote}>
      <NodeContentRenderer node={node} keyPrefix={keyPrefix} />
    </blockquote>
  );
};

export { BlockquoteRenderer };
