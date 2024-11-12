import { MessageNode } from '@/types/messages';
import { CircleX } from 'lucide-react';

interface MessageReplyBannerProps {
  message: MessageNode;
  onCancel: () => void;
}

export const MessageReplyBanner = ({
  message,
  onCancel,
}: MessageReplyBannerProps) => {
  return (
    <div className="flex flex-row items-center justify-between rounded-t-lg border-b-2 bg-gray-100 p-2 text-foreground">
      <p className="text-sm">
        Replying to <span className="font-semibold">{message.author.name}</span>
      </p>
      <button className="cursor-pointer" onClick={onCancel}>
        <CircleX className="size-4" />
      </button>
    </div>
  );
};
