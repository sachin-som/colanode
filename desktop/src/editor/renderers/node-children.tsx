import React from 'react';

import { NodeWithChildren } from '@/types/nodes';
import { NodeBlockRenderer } from '@/editor/renderers/node-block';
import { NodeRenderer } from '@/editor/renderers/node';

interface NodeChildrenRendererProps {
  node: NodeWithChildren;
  keyPrefix: string | null;
}

export const NodeChildrenRenderer = ({
  node,
  keyPrefix,
}: NodeChildrenRendererProps) => {
  if (node.children && node.children.length > 0) {
    return (
      <React.Fragment>
        {node.children.map((nodeChild, index) => (
          <NodeRenderer node={nodeChild} keyPrefix={keyPrefix} key={index} />
        ))}
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      {node.content.map((nodeBlock, index) => (
        <NodeBlockRenderer node={nodeBlock} keyPrefix={keyPrefix} key={index} />
      ))}
    </React.Fragment>
  );
};
