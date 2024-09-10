import React from 'react';
import { InView } from 'react-intersection-observer';
import { Message } from '@/components/messages/message';
import { useMessagesQuery } from '@/queries/use-messages-query';

interface MessageListProps {
  conversationId: string;
  onLastMessageIdChange: (id: string) => void;
}

export const MessageList = ({
  conversationId,
  onLastMessageIdChange,
}: MessageListProps) => {
  const lastMessageId = React.useRef<string | null>(null);

  const { data, isPending, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useMessagesQuery(conversationId);

  React.useEffect(() => {
    if (data?.length > 0) {
      const lastMessage = data[data.length - 1];
      if (lastMessage.id !== lastMessageId.current) {
        lastMessageId.current = lastMessage.id;
        onLastMessageIdChange(lastMessageId.current);
      }
    }
  }, [data]);

  if (isPending) {
    return null;
  }

  return (
    <React.Fragment>
      <InView
        rootMargin="200px"
        onChange={(inView) => {
          if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
      ></InView>
      {data.map((message, index) => {
        const previousMessage = index > 0 ? data[index - 1] : null;

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
            <Message message={message} previousMessage={previousMessage} />
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
};
