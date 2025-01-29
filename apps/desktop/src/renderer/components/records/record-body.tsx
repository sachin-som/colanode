import { EntryRole, hasEntryRole, RecordEntry } from '@colanode/core';
import { JSONContent } from '@tiptap/core';
import { useCallback } from 'react';

import { Document } from '@/renderer/components/documents/document';
import { RecordAttributes } from '@/renderer/components/records/record-attributes';
import { RecordProvider } from '@/renderer/components/records/record-provider';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { Separator } from '@/renderer/components/ui/separator';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { toast } from '@/renderer/hooks/use-toast';
import { RecordDatabase } from '@/renderer/components/records/record-database';

interface RecordBodyProps {
  record: RecordEntry;
  role: EntryRole;
}

export const RecordBody = ({ record, role }: RecordBodyProps) => {
  const workspace = useWorkspace();

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

  return (
    <RecordDatabase id={record.attributes.databaseId} role={role}>
      <ScrollArea className="h-full max-h-full w-full overflow-y-auto">
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
    </RecordDatabase>
  );
};
