import React from 'react';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { LocalNodeWithChildren } from '@/types/nodes';

interface DocumentRendererProps {
  node: LocalNodeWithChildren;
  keyPrefix: string | null;
}

export const DocumentRenderer = ({
  node,
  keyPrefix,
}: DocumentRendererProps) => {
  return <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />;
};
