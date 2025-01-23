import {
  DatabaseEntry,
  EntryRole,
  hasEntryRole,
  RecordEntry,
} from '@colanode/core';
import { JSONContent } from '@tiptap/core';
import { useCallback, useEffect } from 'react';

import { Database } from '@/renderer/components/databases/database';
import { Document } from '@/renderer/components/documents/document';
import { RecordAttributes } from '@/renderer/components/records/record-attributes';
import { RecordProvider } from '@/renderer/components/records/record-provider';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { Separator } from '@/renderer/components/ui/separator';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { toast } from '@/renderer/hooks/use-toast';
import { useRadar } from '@/renderer/contexts/radar';

interface RecordBodyProps {
  record: RecordEntry;
  database: DatabaseEntry;
  role: EntryRole;
}

export const RecordBody = ({ record, database, role }: RecordBodyProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  const canEdit =
    record.createdBy === workspace.userId || hasEntryRole(role, 'editor');

  const handleUpdate = useCallback(
    async (before: JSONContent, after: JSONContent) => {
      const result = await window.colanode.executeMutation({
        type: 'record_content_update',
        accountId: workspace.accountId,
        workspaceId: workspace.id,
        recordId: record.id,
        before,
        after,
      });

      if (!result.success) {
        toast({
          title: 'Failed to update page',
          description: result.error.message,
          variant: 'destructive',
        });
      }
    },
    [workspace.accountId, workspace.id, record.id]
  );

  useEffect(() => {
    radar.markEntryAsOpened(workspace.accountId, workspace.id, record.id);

    const interval = setInterval(() => {
      radar.markEntryAsOpened(workspace.accountId, workspace.id, record.id);
    }, 60000);

    return () => clearInterval(interval);
  }, [record.id, record.type, record.transactionId]);

  return (
    <Database database={database} role={role}>
      <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
        <RecordProvider record={record} role={role}>
          <RecordAttributes />
        </RecordProvider>
        <Separator className="my-4 w-full" />
        <Document
          entryId={record.id}
          rootId={record.rootId}
          content={record.attributes.content}
          transactionId={record.transactionId}
          canEdit={canEdit}
          onUpdate={handleUpdate}
          autoFocus={false}
        />
      </ScrollArea>
    </Database>
  );
};
