import React from 'react';
import { defaultClasses } from '@/editor/classes';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { NodeWithChildren } from '@/types/nodes';

interface HeadingRendererProps {
  node: NodeWithChildren;
  keyPrefix: string | null;
}

export const HeadingRenderer = ({ node, keyPrefix }: HeadingRendererProps) => {
  const level = node.attrs?.level;

  if (level === 1) {
    return (
      <h1 className={defaultClasses.heading[1]}>
        <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
      </h1>
    );
  }

  if (level === 2) {
    return (
      <h2 className={defaultClasses.heading[2]}>
        <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
      </h2>
    );
  }

  if (level === 3) {
    return (
      <h3 className={defaultClasses.heading[3]}>
        <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
      </h3>
    );
  }

  return null;
};
