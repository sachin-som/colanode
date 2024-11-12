import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { ChannelHeader } from '@/renderer/components/channels/channel-header';
import { extractNodeRole } from '@colanode/core';
import { ChannelBody } from '@/renderer/components/channels/channel-body';

interface ChannelContainerProps {
  nodeId: string;
}

export const ChannelContainer = ({ nodeId }: ChannelContainerProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    type: 'node_with_ancestors_get',
    nodeId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  const nodes = data ?? [];
  const channel = nodes.find((node) => node.id === nodeId);
  const role = extractNodeRole(nodes, workspace.userId);

  if (!channel || channel.type !== 'channel' || !role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <ChannelHeader nodes={nodes} channel={channel} role={role} />
      <ChannelBody channel={channel} />
    </div>
  );
};
