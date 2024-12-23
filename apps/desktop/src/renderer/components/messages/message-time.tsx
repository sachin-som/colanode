import { formatDate, timeAgo } from '@colanode/core';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/renderer/components/ui/tooltip';
import { MessageNode } from '@/shared/types/messages';
interface MessageTimeProps {
  message: MessageNode;
}

export const MessageTime = ({ message }: MessageTimeProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="ml-2 text-xs text-muted-foreground">
          {timeAgo(message.createdAt)}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <span className="text-sm shadow-md">
          {formatDate(message.createdAt)}
        </span>
      </TooltipContent>
    </Tooltip>
  );
};
