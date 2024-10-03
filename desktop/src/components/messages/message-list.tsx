import React from 'react';
import { InView } from 'react-intersection-observer';
import { Message } from '@/components/messages/message';
import { useInfiniteQuery } from '@/renderer/hooks/use-infinite-query';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { compareString } from '@/lib/utils';

interface MessageListProps {
  conversationId: string;
  onLastMessageIdChange: (id: string) => void;
}

const MESSAGES_PER_PAGE = 50;

export const MessageList = ({
  conversationId,
  onLastMessageIdChange,
}: MessageListProps) => {
  const workspace = useWorkspace();
  const lastMessageId = React.useRef<string | null>(null);

  const { data, isPending, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      initialPageInput: {
        type: 'message_list',
        conversationId: conversationId,
        userId: workspace.userId,
        page: 0,
        count: MESSAGES_PER_PAGE,
      },
      getNextPageInput(page, pages) {
        if (page > pages.length) {
          return undefined;
        }

        const lastPage = pages[page - 1];
        if (lastPage.length < MESSAGES_PER_PAGE) {
          return undefined;
        }

        return {
          type: 'message_list',
          conversationId: conversationId,
          userId: workspace.userId,
          page: page,
          count: MESSAGES_PER_PAGE,
        };
      },
    });

  const messages = (data?.flatMap((page) => page) ?? []).sort((a, b) =>
    compareString(a.id, b.id),
  );

  React.useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
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
            <Message message={message} previousMessage={previousMessage} />
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
};
