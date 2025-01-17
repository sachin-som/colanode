import { useCallback, useEffect } from 'react';
import { EntryRole, PageEntry, hasEntryRole } from '@colanode/core';
import { JSONContent } from '@tiptap/core';

import { Document } from '@/renderer/components/documents/document';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';
import { useRadar } from '@/renderer/contexts/radar';

interface PageBodyProps {
  page: PageEntry;
  role: EntryRole;
}

export const PageBody = ({ page, role }: PageBodyProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();
  const { mutate } = useMutation();
  const canEdit = hasEntryRole(role, 'editor');

  const handleUpdate = useCallback(
    (before: JSONContent, after: JSONContent) => {
      mutate({
        input: {
          type: 'page_content_update',
          accountId: workspace.accountId,
          workspaceId: workspace.id,
          pageId: page.id,
          before,
          after,
        },
        onError(error) {
          toast({
            title: 'Failed to update page',
            description: error.message,
            variant: 'destructive',
          });
        },
      });
    },
    [mutate, workspace.userId, page.id]
  );

  useEffect(() => {
    radar.markEntryAsOpened(workspace.accountId, workspace.id, page.id);

    const interval = setInterval(() => {
      radar.markEntryAsOpened(workspace.accountId, workspace.id, page.id);
    }, 60000);

    return () => clearInterval(interval);
  }, [page.id, page.type, page.transactionId]);

  return (
    <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
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
