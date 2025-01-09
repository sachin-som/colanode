import { MessageAuthorAvatar } from '@/renderer/components/messages/message-author-avatar';
import { MessageAuthorName } from '@/renderer/components/messages/message-author-name';
import { MessageContent } from '@/renderer/components/messages/message-content';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface MessageReferenceProps {
  messageId: string;
}

export const MessageReference = ({ messageId }: MessageReferenceProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    type: 'message_get',
    messageId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  if (!data) {
    return (
      <div className="flex flex-row gap-2 border-l-4 p-2">
        <span className="text-sm text-muted-foreground">
          Message not found or has been deleted
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-2 border-l-4 p-2">
      <MessageAuthorAvatar message={data} className="size-5 mt-1" />
      <div className='"flex-grow flex-col gap-1'>
        <MessageAuthorName message={data} />
        <MessageContent message={data} />
      </div>
    </div>
  );
};
