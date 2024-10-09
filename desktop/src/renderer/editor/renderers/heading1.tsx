import React from 'react';
import { defaultClasses } from '@/renderer/editor/classes';
import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';
import { JSONContent } from '@tiptap/core';

interface Heading1RendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const Heading1Renderer = ({
  node,
  keyPrefix,
}: Heading1RendererProps) => {
  return (
    <h1 className={defaultClasses.heading1}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </h1>
  );
};
