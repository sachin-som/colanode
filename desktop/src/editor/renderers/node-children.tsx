import React from 'react';

import { NodeTree } from '@/types/nodes';
import { NodeContentRenderer } from '@/editor/renderers/node-content';

interface NodeChildrenRendererProps {
  node: NodeTree;
  keyPrefix: string | null;
}

export const NodeChildrenRenderer = ({
  node,
  keyPrefix,
}: NodeChildrenRendererProps) => {
  if (!node.content) {
    return null;
  }

  return (
    <React.Fragment>
      {node.content.map((innerNode, index) => (
        <NodeContentRenderer
          node={innerNode}
          keyPrefix={keyPrefix}
          key={index}
        />
      ))}
    </React.Fragment>
  );
};
