import React from 'react';
import { defaultClasses } from '@/editor/classes';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { LocalNodeWithChildren } from '@/types/nodes';

interface Heading3RendererProps {
  node: LocalNodeWithChildren;
  keyPrefix: string | null;
}

export const Heading3Renderer = ({
  node,
  keyPrefix,
}: Heading3RendererProps) => {
  return (
    <h3 className={defaultClasses.heading3}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </h3>
  );
};
