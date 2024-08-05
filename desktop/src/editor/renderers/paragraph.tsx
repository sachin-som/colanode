import React from 'react';
import { defaultClasses } from '@/editor/classes';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { NodeWithChildren } from '@/types/nodes';
import { cn } from '@/lib/utils';

interface ParagraphRendererProps {
  node: NodeWithChildren;
  keyPrefix: string | null;
}

export const ParagraphRenderer = ({
  node,
  keyPrefix,
}: ParagraphRendererProps) => {
  if (!node.content || node.content.length === 0) {
    return null;
  }

  return (
    <p className={cn(defaultClasses.paragraph, 'py-0.5')}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </p>
  );
};
