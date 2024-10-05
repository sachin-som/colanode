import React from 'react';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { Document } from '@/renderer/components/documents/document';

interface PageContainerNodeProps {
  nodeId: string;
}

export const PageContainerNode = ({ nodeId }: PageContainerNodeProps) => {
  return (
    <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
      <Document nodeId={nodeId} />
    </ScrollArea>
  );
};
