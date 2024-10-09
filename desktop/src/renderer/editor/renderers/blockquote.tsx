import React from 'react';
import { defaultClasses } from '@/renderer/editor/classes';
import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';
import { JSONContent } from '@tiptap/core';

interface BlockquoteRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

const BlockquoteRenderer = ({ node, keyPrefix }: BlockquoteRendererProps) => {
  return (
    <blockquote className={defaultClasses.blockquote}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </blockquote>
  );
};

export { BlockquoteRenderer };
