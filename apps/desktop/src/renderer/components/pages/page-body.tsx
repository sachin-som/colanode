import { PageNode } from '@colanode/core';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { Document } from '@/renderer/components/documents/document';

interface PageBodyProps {
  page: PageNode;
}

export const PageBody = ({ page }: PageBodyProps) => {
  return (
    <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
      <Document
        nodeId={page.id}
        content={page.attributes.content}
        versionId={page.versionId}
      />
    </ScrollArea>
  );
};
