import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface ChatContainerTabProps {
  chatId: string;
}

export const ChatContainerTab = ({ chatId }: ChatContainerTabProps) => {
  const workspace = useWorkspace();

  const { data: chat } = useQuery({
    type: 'entry_get',
    entryId: chatId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const userId =
    chat && chat.type === 'chat'
      ? (Object.keys(chat.attributes.collaborators).find(
          (id) => id !== workspace.userId
        ) ?? '')
      : '';

  const { data: user } = useQuery({
    type: 'user_get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    userId,
  });

  if (!chat || !user) {
    return <p>Not found</p>;
  }

  return (
    <div className="flex items-center space-x-2">
      <Avatar size="small" id={user.id} name={user.name} avatar={user.avatar} />
      <span>{user.name}</span>
    </div>
  );
};
