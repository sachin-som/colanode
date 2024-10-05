import React from 'react';
import { DocumentEditor } from '@/renderer/components/documents/document-editor';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface DocumentProps {
  nodeId: string;
}

export const Document = ({ nodeId }: DocumentProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    type: 'document_get',
    nodeId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  return <DocumentEditor key={nodeId} nodeId={nodeId} nodes={data?.nodes} />;
};
