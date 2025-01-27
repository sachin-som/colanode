import { MessageCircle } from 'lucide-react';

interface MessageBreadcrumbItemProps {
  id: string;
}

export const MessageBreadcrumbItem = ({ id }: MessageBreadcrumbItemProps) => {
  return (
    <div className="flex items-center space-x-2" id={id}>
      <MessageCircle className="size-4" />
      <span>Message</span>
    </div>
  );
};
