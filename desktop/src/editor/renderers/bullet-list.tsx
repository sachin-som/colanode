import React from 'react';
import { defaultClasses } from '@/editor/classes';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { LocalNodeWithChildren } from '@/types/nodes';

interface BulletListRendererProps {
  node: LocalNodeWithChildren;
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
