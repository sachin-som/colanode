import { ChatNode } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface ChatBreadcrumbItemProps {
  node: ChatNode;
}

export const ChatBreadcrumbItem = ({ node }: ChatBreadcrumbItemProps) => {
  const workspace = useWorkspace();
  const userId =
    Object.keys(node.attributes.collaborators).find(
      (id) => id !== workspace.userId
    ) ?? '';

  const { data, isPending } = useQuery({
    type: 'user_get',
    id: userId,
    userId: workspace.userId,
  });

  if (isPending || !data) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Avatar size="small" id={data.id} name={data.name} avatar={data.avatar} />
      <span>{data.name}</span>
    </div>
  );
};
