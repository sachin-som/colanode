import React from 'react';
import { JSONContent } from '@tiptap/core';

interface TextRendererProps {
  node: JSONContent;
}

export const TextRenderer = ({ node }: TextRendererProps) => {
  return <React.Fragment>{node.text ?? ''}</React.Fragment>;
};
