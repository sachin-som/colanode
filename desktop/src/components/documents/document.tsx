import React from 'react';
import { LocalNode } from '@/types/nodes';
import { DocumentEditor } from '@/components/documents/document-editor';
import { useQuery } from '@/hooks/use-query';
import { useWorkspace } from '@/contexts/workspace';

interface DocumentProps {
  node: LocalNode;
}

export const Document = ({ node }: DocumentProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    type: 'document_get',
    nodeId: node.id,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  return <DocumentEditor key={node.id} node={node} nodes={data?.nodes} />;
};
