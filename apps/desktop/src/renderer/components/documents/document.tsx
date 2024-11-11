import { Block } from '@colanode/core';
import { DocumentEditor } from '@/renderer/components/documents/document-editor';
import { mapBlocksToContents } from '@/lib/editor';

interface DocumentProps {
  nodeId: string;
  content?: Record<string, Block> | null;
  versionId: string;
}

export const Document = ({ nodeId, content, versionId }: DocumentProps) => {
  const nodeBlocks = Object.values(content ?? {});
  const contents = mapBlocksToContents(nodeId, nodeBlocks);

  if (!contents.length) {
    contents.push({
      type: 'paragraph',
    });
  }

  const tiptapContent = {
    type: 'doc',
    content: contents,
  };

  return (
    <DocumentEditor
      key={nodeId}
      documentId={nodeId}
      content={tiptapContent}
      versionId={versionId}
    />
  );
};
