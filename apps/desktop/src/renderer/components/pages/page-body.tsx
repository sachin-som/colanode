import { useCallback } from 'react';
import { EntryRole, PageEntry, hasEntryRole } from '@colanode/core';
import { JSONContent } from '@tiptap/core';

import { Document } from '@/renderer/components/documents/document';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { toast } from '@/renderer/hooks/use-toast';

interface PageBodyProps {
  page: PageEntry;
  role: EntryRole;
}

export const PageBody = ({ page, role }: PageBodyProps) => {
  const workspace = useWorkspace();
  const canEdit = hasEntryRole(role, 'editor');

  const handleUpdate = useCallback(
    async (before: JSONContent, after: JSONContent) => {
      const result = await window.colanode.executeMutation({
        type: 'page_content_update',
        accountId: workspace.accountId,
        workspaceId: workspace.id,
        pageId: page.id,
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
    [workspace.accountId, workspace.id, page.id]
  );

  return (
    <ScrollArea className="h-full max-h-full w-full overflow-y-auto">
      <Document
        entryId={page.id}
        rootId={page.rootId}
        content={page.attributes.content}
        transactionId={page.transactionId}
        canEdit={canEdit}
        onUpdate={handleUpdate}
        autoFocus="start"
      />
    </ScrollArea>
  );
};
