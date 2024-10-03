import React from 'react';
import { NodeBlock } from '@/types/nodes';

export const TextRenderer = ({ node }: { node: NodeBlock }) => {
  return <React.Fragment>{node.text ?? ''}</React.Fragment>;
};
