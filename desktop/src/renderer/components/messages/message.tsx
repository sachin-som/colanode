import React from 'react';
import { Avatar } from '@/renderer/components/avatars/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/renderer/components/ui/tooltip';
import { formatDate, timeAgo } from '@/lib/utils';
import { InView } from 'react-intersection-observer';
import { MessageReactionCreatePopover } from '@/renderer/components/messages/message-reaction-create-popover';
import { Icon } from '@/renderer/components/ui/icon';
import { MessageDeleteButton } from '@/renderer/components/messages/message-delete-button';
import { NodeRenderer } from '@/renderer/editor/renderers/node';
import { MessageNode } from '@/types/messages';
import { MessageReactions } from '@/renderer/components/messages/message-reactions';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface MessageProps {
  message: MessageNode;
  previousMessage?: MessageNode;
}

const shouldDisplayUserInfo = (
  message: MessageNode,
  previousMessage?: MessageNode,
) => {
  if (!previousMessage) {
    return true;
  }

  const previousMessageDate = new Date(previousMessage.createdAt);
  const currentMessageDate = new Date(message.createdAt);

  if (previousMessageDate.getDate() !== currentMessageDate.getDate()) {
    return true;
  }

  return previousMessage.author.id !== message.author.id;
};

export const Message = ({ message, previousMessage }: MessageProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  if (!message.content || message.content.length === 0) {
    return null;
  }

  const canEdit = true;
  const canDelete = true;
  const canReplyInThread = false;
  const displayUserInfo = shouldDisplayUserInfo(message, previousMessage);

  return (
    <div
      id={`message-${message.id}`}
      key={`message-${message.id}`}
      className={`group flex flex-row px-1 hover:bg-gray-50 ${
        displayUserInfo ? 'mt-2 first:mt-0' : ''
      }`}
    >
      <div className="mr-2 w-10 pt-1">
        {displayUserInfo && (
          <Avatar
            id={message.author.id}
            name={message.author.name}
            size="medium"
          />
        )}
      </div>

      <div className="relative w-full">
        {displayUserInfo && (
          <p className="font-medium">
            {message.author.name}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-2 text-xs text-muted-foreground">
                  {timeAgo(message.createdAt)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <span className="border border-gray-100 bg-white p-2 text-sm text-muted-foreground shadow-md">
                  {formatDate(message.createdAt)}
                </span>
              </TooltipContent>
            </Tooltip>
          </p>
        )}

        <InView
          rootMargin="50px"
          onChange={(inView) => {
            // onVisibilityChange?.(data.id, inView);
          }}
        >
          <ul className="invisible absolute -top-2 right-1 z-10 flex flex-row bg-gray-100 text-muted-foreground shadow group-hover:visible">
            {canReplyInThread && (
              <li className="flex h-8 w-7 cursor-pointer items-center justify-center hover:bg-gray-200">
                <Icon name="question-answer-line" className="cursor-pointer" />
              </li>
            )}
            <li className="flex h-8 w-7 cursor-pointer items-center justify-center hover:bg-gray-200">
              <MessageReactionCreatePopover
                onReactionClick={(reaction) => {
                  if (isPending) {
                    return;
                  }

                  mutate({
                    input: {
                      type: 'node_reaction_create',
                      nodeId: message.id,
                      userId: workspace.userId,
                      reaction,
                    },
                  });
                }}
              />
            </li>
            <li className="flex h-8 w-7 cursor-pointer items-center justify-center hover:bg-gray-200">
              <Icon name="reply-line" className="cursor-pointer" />
            </li>
            {canDelete && (
              <li className="flex h-8 w-7 cursor-pointer items-center justify-center hover:bg-gray-200">
                <MessageDeleteButton id={message.id} />
              </li>
            )}
          </ul>
          <div className="text-foreground">
            {message.content.map((node) => (
              <NodeRenderer key={node.id} node={node} keyPrefix={node.id} />
            ))}
          </div>
          {message.reactionCounts.length > 0 && (
            <MessageReactions
              message={message}
              onReactionClick={(reaction) => {
                if (isPending) {
                  return;
                }

                if (message.userReactions.includes(reaction)) {
                  mutate({
                    input: {
                      type: 'node_reaction_delete',
                      nodeId: message.id,
                      userId: workspace.userId,
                      reaction,
                    },
                  });
                } else {
                  mutate({
                    input: {
                      type: 'node_reaction_create',
                      nodeId: message.id,
                      userId: workspace.userId,
                      reaction,
                    },
                  });
                }
              }}
            />
          )}
        </InView>
      </div>
    </div>
  );
};
