import React from 'react';
import { NodeBlock } from '@/types/nodes';
import { TextRenderer } from '@/editor/renderers/text';
import { MarkRenderer } from '@/editor/renderers/mark';

interface NodeBlockRendererProps {
  node: NodeBlock;
  keyPrefix: string | null;
}

export const NodeBlockRenderer = ({ node }: NodeBlockRendererProps) => {
  return (
    <MarkRenderer node={node}>
      <TextRenderer node={node} />
    </MarkRenderer>
  );
};
