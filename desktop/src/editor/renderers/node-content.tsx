import React from 'react';
import { NodeContentTree } from '@/types/nodes';
import { NodeRenderer } from '@/editor/renderers/node';
import { TextRenderer } from '@/editor/renderers/text';
import { MarkRenderer } from '@/editor/renderers/mark';

interface NodeContentRendererProps {
  node: NodeContentTree;
  keyPrefix: string | null;
}

export const NodeContentRenderer = ({
  node,
  keyPrefix,
}: NodeContentRendererProps) => {
  if (node.node) {
    return <NodeRenderer node={node.node} keyPrefix={keyPrefix} />;
  }

  return (
    <MarkRenderer node={node}>
      <TextRenderer node={node} />
    </MarkRenderer>
  );
};
