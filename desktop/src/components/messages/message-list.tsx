import React from 'react';
import { Node } from '@/types/nodes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InView } from 'react-intersection-observer';
import { Message } from '@/components/messages/message';

interface MessageListProps {
  conversationId: string;
  nodes: Node[];
}

export const MessageList = ({ conversationId, nodes }: MessageListProps) => {
  const messages = nodes
    .filter((node) => node.type === 'message')
    .sort((a, b) => {
      if (a.id > b.id) {
        return 1;
      } else if (a.id < b.id) {
        return -1;
      } else {
        return 0;
      }
    });

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const observerRef = React.useRef<ResizeObserver | null>(null);
  const scrollPosition = React.useRef<number>(0);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const bottomVisibleRef = React.useRef<boolean>(false);
  const shouldScrollToBottom = React.useRef<boolean>(true);

  React.useEffect(() => {
    if (bottomRef.current && scrollPosition.current == 0) {
      bottomRef.current.scrollIntoView();
    }

    if (containerRef.current && viewportRef.current) {
      // observe resize of container when new messages are appended or internal elements are loaded (e.g. images)
      observerRef.current = new ResizeObserver(() => {
        if (!viewportRef.current) {
          return;
        }

        if (shouldScrollToBottom) {
          bottomRef.current?.scrollIntoView();
        } else {
          viewportRef.current.scrollTop =
            viewportRef.current.scrollHeight - scrollPosition.current;
        }
      });

      observerRef.current.observe(containerRef.current);

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }
  }, [conversationId]);

  const handleScroll = () => {
    if (viewportRef.current) {
      scrollPosition.current =
        viewportRef.current.scrollHeight - viewportRef.current.scrollTop;

      shouldScrollToBottom.current = bottomVisibleRef.current;
    }
  };

  return (
    <ScrollArea
      ref={viewportRef}
      onScroll={handleScroll}
      className="flex-grow overflow-y-auto px-10"
    >
      <InView
        rootMargin="200px"
        onChange={(inView) => {
          // if (inView && hasPrevious && !isLoadingPrevious) {
          //   loadPrevious(50);
          // }
        }}
      >
        {/*<div className="flex w-full items-center justify-center py-4">*/}
        {/*  {isLoadingPrevious && <Loader />}*/}
        {/*</div>*/}
      </InView>
      <div className="" ref={containerRef}>
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
                nodes={nodes}
              />
            </React.Fragment>
          );
        })}
      </div>
      <InView
        className="h-4"
        rootMargin="20px"
        onChange={(inView) => {
          bottomVisibleRef.current = inView;
        }}
      >
        <div ref={bottomRef} className="h-4"></div>
      </InView>
    </ScrollArea>
  );
};
