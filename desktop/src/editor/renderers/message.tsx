import React from 'react';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { LocalNodeWithAttributesAndChildren } from '@/types/nodes';

interface MessageRendererProps {
  node: LocalNodeWithAttributesAndChildren;
  keyPrefix: string | null;
}

export const MessageRenderer = ({ node, keyPrefix }: MessageRendererProps) => {
  return <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />;
};
