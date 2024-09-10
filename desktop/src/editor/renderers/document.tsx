import React from 'react';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { LocalNodeWithAttributesAndChildren } from '@/types/nodes';

interface DocumentRendererProps {
  node: LocalNodeWithAttributesAndChildren;
  keyPrefix: string | null;
}

export const DocumentRenderer = ({
  node,
  keyPrefix,
}: DocumentRendererProps) => {
  return <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />;
};
