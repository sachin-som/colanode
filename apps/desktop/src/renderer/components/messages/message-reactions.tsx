import React from 'react';
import { MessageNode } from '@/types/messages';
import { EmojiElement } from '@/renderer/components/emojis/emoji-element';
import { cn } from '@/lib/utils';

interface MessageReactionsProps {
  message: MessageNode;
  onReactionClick: (reaction: string) => void;
}

export const MessageReactions = ({
  message,
  onReactionClick,
}: MessageReactionsProps) => {
  if (message.reactionCounts.length === 0) {
    return null;
  }

  return (
    <div className="my-1 flex flex-row gap-2">
      {message.reactionCounts.map((reaction) => {
        if (reaction.count === 0) {
          return null;
        }

        const hasReacted = reaction.isReactedTo;
        return (
          <div
            key={reaction.reaction}
            className={cn(
              'rouded flex flex-row items-center gap-2 px-1 py-0.5 shadow',
              'cursor-pointer text-sm text-muted-foreground hover:text-foreground',
              hasReacted ? 'bg-blue-100' : 'bg-gray-50',
            )}
            onClick={() => onReactionClick(reaction.reaction)}
          >
            <EmojiElement id={reaction.reaction} className="h-5 w-5" />
            <span>{reaction.count}</span>
          </div>
        );
      })}
    </div>
  );
};
