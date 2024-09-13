import React from 'react';
import { useDatabaseQuery } from '@/queries/use-database-query';
import { useRecordQuery } from '@/queries/use-record-query';
import { LocalNode } from '@/types/nodes';
import { Database } from '@/components/databases/database';
import { RecordAttributes } from '@/components/records/record-attributes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Document } from '@/components/documents/document';
import { Separator } from '@/components/ui/separator';

interface RecordContainerNodeProps {
  node: LocalNode;
}

export const RecordContainerNode = ({ node }: RecordContainerNodeProps) => {
  const { data: record, isPending: isRecordPending } = useRecordQuery(node.id);
  const { data: database, isPending: isDatabasePending } = useDatabaseQuery(
    node.parentId,
  );

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
