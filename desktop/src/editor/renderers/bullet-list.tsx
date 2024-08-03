import React from 'react';
import { defaultClasses } from '@/editor/classes';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { NodeTree } from '@/types/nodes';

interface BulletListRendererProps {
  node: NodeTree;
  keyPrefix: string | null;
}

export const BulletListRenderer = ({
  node,
  keyPrefix,
}: BulletListRendererProps) => {
  return (
    <ul className={defaultClasses.bulletList}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </ul>
  );
};
