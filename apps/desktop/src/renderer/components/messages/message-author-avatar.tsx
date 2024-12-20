import { MessageNode } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface MessageAuthorAvatarProps {
  message: MessageNode;
  className?: string;
}

export const MessageAuthorAvatar = ({
  message,
  className,
}: MessageAuthorAvatarProps) => {
  const workspace = useWorkspace();
  const { data } = useQuery({
    type: 'user_get',
    id: message.createdBy,
    userId: workspace.userId,
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
