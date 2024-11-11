import React from 'react';
import { InView } from 'react-intersection-observer';
import { Message } from '@/renderer/components/messages/message';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { compareString } from '@/lib/utils';
import { MessageNode } from '@/types/messages';
import { useQueries } from '@/renderer/hooks/use-queries';
import { MessageListQueryInput } from '@/operations/queries/message-list';

interface MessageListProps {
  conversationId: string;
  onLastMessageIdChange: (id: string) => void;
  onReply: (replyTo: MessageNode | null) => void;
}

const MESSAGES_PER_PAGE = 50;

export const MessageList = ({
  conversationId,
  onLastMessageIdChange,
  onReply,
}: MessageListProps) => {
  const workspace = useWorkspace();
  const lastMessageId = React.useRef<string | null>(null);
  const [lastPage, setLastPage] = React.useState<number>(1);

  const inputs: MessageListQueryInput[] = Array.from({
    length: lastPage,
  }).map((_, i) => ({
    type: 'message_list',
    conversationId: conversationId,
    userId: workspace.userId,
    page: i + 1,
    count: MESSAGES_PER_PAGE,
  }));

  const result = useQueries(inputs);
  const messages = result
    .flatMap((data) => data.data ?? [])
    .sort((a, b) => compareString(a.id, b.id));

  const isPending = result.some((data) => data.isPending);

  const hasMore =
    !isPending && messages.length === lastPage * MESSAGES_PER_PAGE;

  React.useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.id !== lastMessageId.current) {
        lastMessageId.current = lastMessage.id;
        onLastMessageIdChange(lastMessageId.current);
      }
    }
  }, [messages]);

  return (
    <React.Fragment>
      <InView
        rootMargin="200px"
        onChange={(inView) => {
          if (inView && hasMore && !isPending) {
            setLastPage(lastPage + 1);
          }
        }}
      ></InView>
      {messages.map((message, index) => {
        const previousMessage = index > 0 ? messages[index - 1] : null;

        const currentMessageDate = new Date(message.createdAt);
        const previousMessageDate = previousMessage
          ? new Date(previousMessage.createdAt)
          : null;
        const showDate =
          !previousMessageDate ||
          currentMessageDate.getDate() !== previousMessageDate.getDate();

        return (
          <React.Fragment key={message.id}>
            {showDate && (
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-gray-100" />
                <span className="mx-4 flex-shrink text-xs text-muted-foreground">
                  {currentMessageDate.toDateString()}
                </span>
                <div className="flex-grow border-t border-gray-100" />
              </div>
            )}
            <Message
              message={message}
              previousMessage={previousMessage}
              onReply={onReply}
            />
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
};
