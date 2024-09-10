import React from 'react';
import { LocalNode } from '@/types/nodes';
import { DocumentEditor } from './document-editor';
import { useDocumentQuery } from '@/queries/use-document-query';

interface DocumentProps {
  node: LocalNode;
}

export const Document = ({ node }: DocumentProps) => {
  const { data, isPending } = useDocumentQuery(node.id);

  if (isPending) {
    return null;
  }

  return <DocumentEditor key={node.id} node={node} nodes={data} />;
};
