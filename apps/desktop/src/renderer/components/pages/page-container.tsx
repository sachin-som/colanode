import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { Document } from '@/renderer/components/documents/document';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { extractNodeRole } from '@colanode/core';
import { PageHeader } from '@/renderer/components/pages/page-header';

interface PageContainerProps {
  nodeId: string;
}

export const PageContainer = ({ nodeId }: PageContainerProps) => {
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
  const page = nodes.find((node) => node.id === nodeId);
  const role = extractNodeRole(nodes, workspace.userId);

  if (!page || page.type !== 'page' || !role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <PageHeader nodes={nodes} page={page} role={role} />
      <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
        <Document
          nodeId={page.id}
          content={page.attributes.content}
          versionId={page.versionId}
        />
      </ScrollArea>
    </div>
  );
};
