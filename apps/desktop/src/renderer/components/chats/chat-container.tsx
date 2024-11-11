import { Conversation } from '@/renderer/components/messages/conversation';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { ChatHeader } from '@/renderer/components/chats/chat-header';

interface ChatContainerProps {
  nodeId: string;
}

export const ChatContainer = ({ nodeId }: ChatContainerProps) => {
  const workspace = useWorkspace();

  const { data, isPending } = useQuery({
    type: 'node_get',
    nodeId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  const node = data;
  if (!node || node.type !== 'chat') {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <ChatHeader chat={node} />
      <Conversation conversationId={nodeId} />
    </div>
  );
};
