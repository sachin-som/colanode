import React from 'react';
import { useQuery } from '@/renderer/hooks/use-query';
import { Database } from '@/renderer/components/databases/database';
import { RecordAttributes } from '@/renderer/components/records/record-attributes';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { Document } from '@/renderer/components/documents/document';
import { Separator } from '@/renderer/components/ui/separator';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { RecordProvider } from '@/renderer/components/records/record-provider';

interface RecordContainerProps {
  nodeId: string;
}

export const RecordContainer = ({ nodeId }: RecordContainerProps) => {
  const workspace = useWorkspace();

  const { data, isPending } = useQuery({
    type: 'node_get',
    nodeId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  if (!data || data.type !== 'record') {
    return null;
  }

  return (
    <Database databaseId={data.attributes.databaseId}>
      <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
        <RecordProvider record={data}>
          <RecordAttributes />
        </RecordProvider>
        <Separator className="my-4 w-full" />
        <Document nodeId={nodeId} />
      </ScrollArea>
    </Database>
  );
};
