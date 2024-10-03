import React from 'react';
import { MessageList } from '@/renderer/components/messages/message-list';
import { MessageCreate } from '@/renderer/components/messages/message-create';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { InView } from 'react-intersection-observer';

interface ConversationProps {
  conversationId: string;
}

export const Conversation = ({ conversationId }: ConversationProps) => {
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

        if (shouldScrollToBottom.current) {
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
    <React.Fragment>
      <ScrollArea
        ref={viewportRef}
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto px-10"
      >
        <div className="container" ref={containerRef}>
          <MessageList
            conversationId={conversationId}
            onLastMessageIdChange={() => {
              if (shouldScrollToBottom.current && bottomRef.current) {
                bottomRef.current.scrollIntoView();
              }
            }}
          />
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
      <MessageCreate conversationId={conversationId} />
    </React.Fragment>
  );
};
