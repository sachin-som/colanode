import { Block } from '@colanode/core';
import { FocusPosition, JSONContent } from '@tiptap/core';

import { DocumentEditor } from '@/renderer/components/documents/document-editor';
import { mapBlocksToContents } from '@/shared/lib/editor';

interface DocumentProps {
  entryId: string;
  rootId: string;
  content?: Record<string, Block> | null;
  revision: bigint;
  canEdit: boolean;
  onUpdate: (before: JSONContent, after: JSONContent) => void;
  autoFocus?: FocusPosition;
}

export const Document = ({
  entryId,
  rootId,
  content,
  revision,
  canEdit,
  onUpdate,
  autoFocus,
}: DocumentProps) => {
  const entryBlocks = Object.values(content ?? {});
  const contents = mapBlocksToContents(entryId, entryBlocks);

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
      key={entryId}
      documentId={entryId}
      rootId={rootId}
      content={tiptapContent}
      revision={revision}
      canEdit={canEdit}
      onUpdate={onUpdate}
      autoFocus={autoFocus}
    />
  );
};
