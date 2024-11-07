import { Conversation } from '@/renderer/components/messages/conversation';

interface ChannelContainerProps {
  nodeId: string;
}

export const ChannelContainer = ({ nodeId }: ChannelContainerProps) => {
  return <Conversation conversationId={nodeId} />;
};
