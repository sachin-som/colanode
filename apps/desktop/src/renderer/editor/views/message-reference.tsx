import React from 'react';
import { type NodeViewProps } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';

export const MessageReferenceNodeView = ({ node }: NodeViewProps) => {
  const name = node.attrs.name ?? 'Unnamed';

  if (!name) {
    return null;
  }

  return (
    <NodeViewWrapper
      data-id={node.attrs.id}
      className="items-top flex flex-col gap-2 border-l-4 p-2 text-sm text-foreground"
    >
      <p className="font-medium">{name}</p>
      <NodeViewContent />
    </NodeViewWrapper>
  );
};
