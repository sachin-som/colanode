import React from 'react';
import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import { Avatar } from '@/components/ui/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';

export const PageNodeView = ({ node }: NodeViewProps) => {
  const workspace = useWorkspace();
  const id = node.attrs.id;
  const name = node.attrs.name ?? 'Unnamed';
  const avatar = node.attrs.avatar;

  if (!id) {
    return null;
  }

  return (
    <NodeViewWrapper
      data-block-id={node.attrs.blockId}
      className="my-0.5 flex h-12 w-full cursor-pointer flex-row items-center gap-1 rounded-md bg-gray-50 p-2 hover:bg-gray-100"
      onClick={() => {
        workspace.navigateToNode(id);
      }}
    >
      <Avatar size="small" id={id} name={name} avatar={avatar} />
      <div role="presentation" className="flex-grow">
        {name}
      </div>
    </NodeViewWrapper>
  );
};
