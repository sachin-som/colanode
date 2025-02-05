import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { LocalMessageNode } from '@/shared/types/nodes';

interface MessageAuthorAvatarProps {
  message: LocalMessageNode;
  className?: string;
}

export const MessageAuthorAvatar = ({
  message,
  className,
}: MessageAuthorAvatarProps) => {
  const workspace = useWorkspace();
  const { data } = useQuery({
    type: 'user_get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    userId: message.createdBy,
  });

  if (!data) {
    return null;
  }

  return (
    <Avatar
      id={data.id}
      name={data.name}
      avatar={data.avatar}
      size="medium"
      className={className}
    />
  );
};
