import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { useRadar } from '@/renderer/contexts/radar';
import { UnreadBadge } from '@/renderer/components/ui/unread-badge';

interface ChatContainerTabProps {
  chatId: string;
  isActive: boolean;
}

export const ChatContainerTab = ({
  chatId,
  isActive,
}: ChatContainerTabProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  const { data: chat, isPending: isChatPending } = useQuery({
    type: 'node_get',
    nodeId: chatId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const userId =
    chat && chat.type === 'chat'
      ? (Object.keys(chat.attributes.collaborators).find(
          (id) => id !== workspace.userId
        ) ?? '')
      : '';

  const { data: user, isPending: isUserPending } = useQuery({
    type: 'user_get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    userId,
  });

  if (isChatPending || isUserPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (!chat || !user) {
    return <p className="text-sm text-muted-foreground">Not found</p>;
  }

  const unreadState = radar.getNodeState(
    workspace.accountId,
    workspace.id,
    chat.id
  );

  return (
    <div className="flex items-center space-x-2">
      <Avatar size="small" id={user.id} name={user.name} avatar={user.avatar} />
      <span>{user.name}</span>
      {!isActive && (
        <UnreadBadge
          count={unreadState.unreadCount}
          unread={unreadState.hasUnread}
        />
      )}
    </div>
  );
};
