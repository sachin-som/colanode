import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface ChatBreadcrumbItemProps {
  id: string;
}

export const ChatBreadcrumbItem = ({ id }: ChatBreadcrumbItemProps) => {
  const workspace = useWorkspace();

  const { data: chat } = useQuery({
    type: 'entry_get',
    entryId: id,
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
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        id={user.id}
        name={user.name}
        avatar={user.avatar}
        className="size-4"
      />
      <span>{user.name}</span>
    </div>
  );
};
