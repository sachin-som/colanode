import React from 'react';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { NodeWithChildren } from '@/types/nodes';

interface MessageRendererProps {
  node: NodeWithChildren;
  keyPrefix: string | null;
}

export const MessageRenderer = ({ node, keyPrefix }: MessageRendererProps) => {
  return <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />;
};
