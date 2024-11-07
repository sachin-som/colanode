import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { Document } from '@/renderer/components/documents/document';

interface PageContainerProps {
  nodeId: string;
}

export const PageContainer = ({ nodeId }: PageContainerProps) => {
  return (
    <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
      <Document nodeId={nodeId} />
    </ScrollArea>
  );
};
