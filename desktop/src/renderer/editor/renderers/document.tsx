import React from 'react';
import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';
import { JSONContent } from '@tiptap/core';

interface DocumentRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const DocumentRenderer = ({
  node,
  keyPrefix,
}: DocumentRendererProps) => {
  return <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />;
};
