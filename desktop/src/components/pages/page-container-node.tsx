import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LocalNode } from '@/types/nodes';
import { Document } from '@/components/documents/document';

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
