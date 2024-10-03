import React from 'react';
import { useQuery } from '@/hooks/use-query';
import { LocalNode } from '@/types/nodes';
import { Database } from '@/components/databases/database';
import { RecordAttributes } from '@/components/records/record-attributes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Document } from '@/components/documents/document';
import { Separator } from '@/components/ui/separator';
import { useWorkspace } from '@/contexts/workspace';

interface RecordContainerNodeProps {
  node: LocalNode;
}

export const RecordContainerNode = ({ node }: RecordContainerNodeProps) => {
  const workspace = useWorkspace();

  const { data: record, isPending: isRecordPending } = useQuery({
    type: 'record_get',
    recordId: node.id,
    userId: workspace.userId,
  });

  const { data: database, isPending: isDatabasePending } = useQuery({
    type: 'database_get',
    databaseId: node.parentId,
    userId: workspace.userId,
  });

  if (isRecordPending || isDatabasePending) {
    return null;
  }

  if (!record) {
    return null;
  }

  return (
    <Database node={database}>
      <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
        <RecordAttributes record={record} />
        <Separator className="my-4 w-full" />
        <Document node={node} />
      </ScrollArea>
    </Database>
  );
};
