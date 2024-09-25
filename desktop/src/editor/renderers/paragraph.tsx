import React from 'react';
import { defaultClasses } from '@/editor/classes';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { LocalNodeWithChildren } from '@/types/nodes';
import { cn } from '@/lib/utils';

interface ParagraphRendererProps {
  node: LocalNodeWithChildren;
  keyPrefix: string | null;
}

export const ParagraphRenderer = ({
  node,
  keyPrefix,
}: ParagraphRendererProps) => {
  if (!node.attributes.content || node.attributes.content.length === 0) {
    return null;
  }

  return (
    <p className={cn(defaultClasses.paragraph, 'py-0.5')}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </p>
  );
};
