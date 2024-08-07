import React from 'react';
import { useDocument } from '@/hooks/use-document';
import { Node } from '@/types/nodes';
import { DocumentEditor } from './document-editor';
import { mapToEditorContent } from '@/editor/utils';
import { observer } from 'mobx-react-lite';

interface DocumentProps {
  node: Node;
}

export const Document = observer(({ node }: DocumentProps) => {
  const { isLoading, nodes, onUpdate } = useDocument(node);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const content = mapToEditorContent(node, nodes);
  return <DocumentEditor id={node.id} content={content} onUpdate={onUpdate} />;
});
