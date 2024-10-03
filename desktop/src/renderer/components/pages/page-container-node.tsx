import React from 'react';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { LocalNode } from '@/types/nodes';
import { Document } from '@/renderer/components/documents/document';

interface PageContainerNodeProps {
  node: LocalNode;
}

export const PageContainerNode = ({ node }: PageContainerNodeProps) => {
  return (
    <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
      <Document node={node} />
    </ScrollArea>
  );
};
