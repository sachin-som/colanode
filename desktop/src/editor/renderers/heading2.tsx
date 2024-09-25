import React from 'react';
import { defaultClasses } from '@/editor/classes';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { LocalNodeWithChildren } from '@/types/nodes';

interface Heading2RendererProps {
  node: LocalNodeWithChildren;
  keyPrefix: string | null;
}

export const Heading2Renderer = ({
  node,
  keyPrefix,
}: Heading2RendererProps) => {
  return (
    <h2 className={defaultClasses.heading2}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </h2>
  );
};
