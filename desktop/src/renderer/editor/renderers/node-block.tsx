import React from 'react';
import { NodeBlock } from '@/types/nodes';
import { TextRenderer } from '@/renderer/editor/renderers/text';
import { MarkRenderer } from '@/renderer/editor/renderers/mark';

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
