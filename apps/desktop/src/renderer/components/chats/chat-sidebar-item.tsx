import { cn } from '@/lib/utils';
import { ChatNode } from '@colanode/core';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface ChatSidebarItemProps {
  node: ChatNode;
}

export const ChatSidebarItem = ({ node }: ChatSidebarItemProps) => {
  const workspace = useWorkspace();

  const collaboratorId =
    Object.keys(node.attributes.collaborators).find(
      (id) => id !== workspace.userId
    ) ?? '';

  const { data, isPending } = useQuery({
    type: 'node_get',
    nodeId: collaboratorId,
    userId: workspace.userId,
  });

  if (isPending || !data || data.type !== 'user') {
    return null;
  }

  const isActive = workspace.isNodeActive(node.id);
  const isUnread = false;
  const mentionsCount = 0;

  return (
    <div
      key={node.id}
      className={cn(
        'flex w-full items-center',
        isActive && 'bg-sidebar-accent'
      )}
    >
      <Avatar
        id={data.id}
        avatar={data.attributes.avatar}
        name={data.attributes.name}
        className="h-5 w-5"
      />
      <span
        className={cn(
          'line-clamp-1 w-full flex-grow pl-2 text-left',
          isUnread && 'font-bold'
        )}
      >
        {data.attributes.name ?? 'Unnamed'}
      </span>
      {mentionsCount > 0 && (
        <span className="mr-1 rounded-md bg-sidebar-accent px-1 py-0.5 text-xs text-sidebar-accent-foreground">
          {mentionsCount}
        </span>
      )}
      {mentionsCount == 0 && isUnread && (
        <span className="size-2 rounded-full bg-red-500" />
      )}
    </div>
  );
};
