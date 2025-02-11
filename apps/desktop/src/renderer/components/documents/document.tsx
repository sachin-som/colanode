import { FocusPosition } from '@tiptap/core';

import { DocumentEditor } from '@/renderer/components/documents/document-editor';
import { LocalNode } from '@/shared/types/nodes';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface DocumentProps {
  node: LocalNode;
  canEdit: boolean;
  autoFocus?: FocusPosition;
}

export const Document = ({ node, canEdit, autoFocus }: DocumentProps) => {
  const workspace = useWorkspace();

  const { data, isPending } = useQuery({
    type: 'document_get',
    documentId: node.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (isPending) {
    return null;
  }

  return (
    <DocumentEditor
      key={node.id}
      node={node}
      document={data}
      canEdit={canEdit}
      autoFocus={autoFocus}
    />
  );
};
