import { NodeRole, hasNodeRole } from '@colanode/core';

import { Document } from '@/renderer/components/documents/document';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { LocalPageNode } from '@/shared/types/nodes';

interface PageBodyProps {
  page: LocalPageNode;
  role: NodeRole;
}

export const PageBody = ({ page, role }: PageBodyProps) => {
  const canEdit = hasNodeRole(role, 'editor');

  return (
    <ScrollArea className="h-full max-h-full w-full overflow-y-auto">
      <Document node={page} canEdit={canEdit} autoFocus="start" />
    </ScrollArea>
  );
};
