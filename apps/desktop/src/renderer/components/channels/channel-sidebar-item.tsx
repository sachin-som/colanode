import { cn } from '@/shared/lib/utils';
import { ChannelNode } from '@colanode/core';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useRadar } from '@/renderer/contexts/radar';

interface ChannelSidebarItemProps {
  node: ChannelNode;
}

export const ChannelSidebarItem = ({ node }: ChannelSidebarItemProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  const isActive = workspace.isNodeActive(node.id);
  const channelState = radar.getChannelState(workspace.userId, node.id);
  const unreadCount = channelState.unseenMessagesCount;
  const mentionsCount = channelState.mentionsCount;

  return (
    <button
      key={node.id}
      className={cn(
        'flex w-full items-center',
        isActive && 'bg-sidebar-accent'
      )}
    >
      <Avatar
        id={node.id}
        avatar={node.attributes.avatar}
        name={node.attributes.name}
        className="h-4 w-4"
      />
      <span
        className={cn(
          'line-clamp-1 w-full flex-grow pl-2 text-left',
          !isActive && unreadCount > 0 && 'font-semibold'
        )}
      >
        {node.attributes.name ?? 'Unnamed'}
      </span>
      {!isActive && mentionsCount > 0 && (
        <span className="mr-1 rounded-md bg-sidebar-accent px-1 py-0.5 text-xs bg-red-400 text-white">
          {mentionsCount}
        </span>
      )}
      {!isActive && mentionsCount === 0 && unreadCount > 0 && (
        <span className="size-2 rounded-full bg-red-500" />
      )}
    </button>
  );
};
