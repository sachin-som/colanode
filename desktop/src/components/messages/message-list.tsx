import React from 'react';
import { InView } from 'react-intersection-observer';
import { Message } from '@/components/messages/message';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { SelectNode } from '@/data/schemas/workspace';
import { QueryResult, sql } from 'kysely';
import { NodeTypes } from '@/lib/constants';
import { useWorkspace } from '@/contexts/workspace';
import { mapNode } from '@/lib/nodes';
import { buildMessages } from '@/lib/messages';

const MESSAGES_PER_PAGE = 50;

interface MessageListProps {
  conversationId: string;
  onLastMessageIdChange: (id: string) => void;
}

export const MessageList = ({
  conversationId,
  onLastMessageIdChange,
}: MessageListProps) => {
  const workspace = useWorkspace();
  const lastMessageId = React.useRef<string | null>(null);

  const { data, isPending, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ['conversation', conversationId],
      initialPageParam: 0,
      getNextPageParam: (lastPage: QueryResult<SelectNode>, pages) => {
        if (lastPage && lastPage.rows) {
          const messageCount = lastPage.rows.filter(
            (row) => row.type === NodeTypes.Message,
          ).length;

          if (messageCount >= MESSAGES_PER_PAGE) {
            return pages.length;
          }
        }
        return undefined;
      },
      queryFn: async ({ queryKey, pageParam }) => {
        const offset = pageParam * MESSAGES_PER_PAGE;
        const query = sql<SelectNode>`
          WITH message_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id = ${conversationId} AND type = ${NodeTypes.Message}
            ORDER BY id DESC
            LIMIT ${sql.lit(MESSAGES_PER_PAGE)}
            OFFSET ${sql.lit(offset)}
          ),
          descendant_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id IN (SELECT id FROM message_nodes)
            UNION ALL
            SELECT child.*
            FROM nodes child
            INNER JOIN descendant_nodes parent ON child.parent_id = parent.id
          ),
          authors AS (
            SELECT *
            FROM nodes
            WHERE id IN (SELECT DISTINCT created_by FROM message_nodes)
          )
          SELECT * FROM message_nodes
          UNION ALL
          SELECT * FROM descendant_nodes
          UNION ALL
          SELECT * FROM authors;
      `.compile(workspace.schema);

        return await workspace.queryAndSubscribe({
          key: queryKey,
          page: pageParam,
          query,
        });
      },
    });

  const pages = data?.pages ?? [];
  const allNodes =
    pages
      .map((page) => page.rows)
      .flat()
      .map((row) => mapNode(row)) ?? [];
  const messages = buildMessages(allNodes);

  React.useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.id !== lastMessageId.current) {
        lastMessageId.current = lastMessage.id;
        onLastMessageIdChange(lastMessageId.current);
      }
    }
  }, [messages]);

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
