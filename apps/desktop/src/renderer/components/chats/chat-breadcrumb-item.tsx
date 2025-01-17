import { ChatEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface ChatBreadcrumbItemProps {
  chat: ChatEntry;
}

export const ChatBreadcrumbItem = ({ chat }: ChatBreadcrumbItemProps) => {
  const workspace = useWorkspace();
  const userId =
    Object.keys(chat.attributes.collaborators).find(
      (id) => id !== workspace.userId
    ) ?? '';

  const { data, isPending } = useQuery({
    type: 'user_get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    userId,
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
