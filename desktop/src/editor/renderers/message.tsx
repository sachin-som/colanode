import React from 'react';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { NodeTree } from '@/types/nodes';

interface MessageRendererProps {
  node: NodeTree;
  keyPrefix: string | null;
}

export const MessageRenderer = ({ node, keyPrefix }: MessageRendererProps) => {
  return <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />;
};
