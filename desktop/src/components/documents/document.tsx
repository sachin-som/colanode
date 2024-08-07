import React from 'react';
import { useDocument } from '@/hooks/use-document';
import { Node } from '@/types/nodes';
import { DocumentEditor } from './document-editor';
import { mapToDocumentContent } from '@/editor/utils';
import { observer } from 'mobx-react-lite';

interface DocumentProps {
  node: Node;
}

export const Document = observer(({ node }: DocumentProps) => {
  const { isLoaded, nodes, onUpdate } = useDocument(node);
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  const content = mapToDocumentContent(node.id, nodes);
  return <DocumentEditor id={node.id} content={content} onUpdate={onUpdate} />;
});
