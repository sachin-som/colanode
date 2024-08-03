import React from 'react';
import { NodeContentTree } from '@/types/nodes';

export const TextRenderer = ({ node }: { node: NodeContentTree }) => {
  return <React.Fragment>{node.text ?? ''}</React.Fragment>;
};
