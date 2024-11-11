import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';
import { ChannelNode, Node, NodeRole } from '@colanode/core';
import { Header } from '@/renderer/components/ui/header';
import { ContainerBreadcrumb } from '@/renderer/components/workspaces/containers/container-breadcrumb';
import { ChannelSettings } from './channel-settings';

interface ChannelHeaderProps {
  nodes: Node[];
  channel: ChannelNode;
  role: NodeRole;
}

export const ChannelHeader = ({ nodes, channel }: ChannelHeaderProps) => {
  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <ContainerBreadcrumb nodes={nodes} />
        <div className="flex items-center gap-2">
          <NodeCollaboratorsPopover nodeId={channel.id} nodes={nodes} />
          <ChannelSettings nodeId={channel.id} />
        </div>
      </div>
    </Header>
  );
};
