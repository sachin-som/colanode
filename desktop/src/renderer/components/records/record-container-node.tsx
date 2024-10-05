import React from 'react';
import { useQuery } from '@/renderer/hooks/use-query';
import { Database } from '@/renderer/components/databases/database';
import { RecordAttributes } from '@/renderer/components/records/record-attributes';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { Document } from '@/renderer/components/documents/document';
import { Separator } from '@/renderer/components/ui/separator';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface RecordContainerNodeProps {
  nodeId: string;
}

export const RecordContainerNode = ({ nodeId }: RecordContainerNodeProps) => {
  const workspace = useWorkspace();

  const { data: record, isPending: isRecordPending } = useQuery({
    type: 'record_get',
    recordId: nodeId,
    userId: workspace.userId,
  });

  if (isRecordPending) {
    return null;
  }

  if (!record) {
    return null;
  }

  return (
    <Database databaseId={record.parentId}>
      <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
        <RecordAttributes record={record} />
        <Separator className="my-4 w-full" />
        <Document nodeId={nodeId} />
      </ScrollArea>
    </Database>
  );
};
