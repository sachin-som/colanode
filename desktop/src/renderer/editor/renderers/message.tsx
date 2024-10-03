import React from 'react';
import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';
import { LocalNodeWithChildren } from '@/types/nodes';

interface MessageRendererProps {
  node: LocalNodeWithChildren;
  keyPrefix: string | null;
}

export const MessageRenderer = ({ node, keyPrefix }: MessageRendererProps) => {
  return <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />;
};
