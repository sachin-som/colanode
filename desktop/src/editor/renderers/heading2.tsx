import React from 'react';
import { defaultClasses } from '@/editor/classes';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { LocalNodeWithAttributesAndChildren } from '@/types/nodes';

interface Heading2RendererProps {
  node: LocalNodeWithAttributesAndChildren;
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
