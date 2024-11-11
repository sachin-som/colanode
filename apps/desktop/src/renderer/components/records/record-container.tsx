import { useQuery } from '@/renderer/hooks/use-query';
import { Database } from '@/renderer/components/databases/database';
import { RecordAttributes } from '@/renderer/components/records/record-attributes';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { Document } from '@/renderer/components/documents/document';
import { Separator } from '@/renderer/components/ui/separator';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { RecordProvider } from '@/renderer/components/records/record-provider';
import { extractNodeRole } from '@colanode/core';
import { RecordHeader } from '@/renderer/components/records/record-header';

interface RecordContainerProps {
  nodeId: string;
}

export const RecordContainer = ({ nodeId }: RecordContainerProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    type: 'node_with_ancestors_get',
    nodeId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  const nodes = data ?? [];
  const record = nodes.find((node) => node.id === nodeId);
  const role = extractNodeRole(nodes, workspace.userId);

  if (!record || record.type !== 'record' || !role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <RecordHeader nodes={nodes} record={record} role={role} />
      <Database databaseId={record.attributes.databaseId}>
        <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
          <RecordProvider record={record}>
            <RecordAttributes />
          </RecordProvider>
          <Separator className="my-4 w-full" />
          <Document
            nodeId={record.id}
            content={record.attributes.content}
            versionId={record.versionId}
          />
        </ScrollArea>
      </Database>
    </div>
  );
};
