import React from 'react';
import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { FilePreview } from '@/renderer/components/files/file-preview';

export const FileNodeView = ({ node }: NodeViewProps) => {
  const workspace = useWorkspace();

  const id = node.attrs.id;
  const { data } = useQuery({
    type: 'file_get',
    fileId: id,
    userId: workspace.userId,
  });

  if (!id) {
    return null;
  }

  if (!data) {
    return null;
  }

  return (
    <NodeViewWrapper
      data-id={node.attrs.id}
      className="flex h-72 max-h-72 w-full cursor-pointer overflow-hidden rounded-md p-2 hover:bg-gray-100"
      onClick={() => {
        workspace.openModal(id);
      }}
    >
      <FilePreview file={data} />
    </NodeViewWrapper>
  );
};
