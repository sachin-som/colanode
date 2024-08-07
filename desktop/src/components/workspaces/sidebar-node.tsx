import React from 'react';
import { Node } from '@/types/nodes';
import { observer } from 'mobx-react-lite';
import { match } from 'ts-pattern';
import { SpaceSidebarNode } from '@/components/spaces/space-sidebar-node';
import { NodeTypes } from '@/lib/constants';
import { ChannelSidebarNode } from '@/components/channels/channel-sidebar-node';
import { PageSidebarNode } from '@/components/pages/page-sidebar-node';

interface SidebarNodeProps {
  node: Node;
}

export const SidebarNode = observer(({ node }: SidebarNodeProps) => {
  return match(node.type)
    .with(NodeTypes.Space, () => <SpaceSidebarNode node={node} />)
    .with(NodeTypes.Channel, () => <ChannelSidebarNode node={node} />)
    .with(NodeTypes.Page, () => <PageSidebarNode node={node} />)
    .otherwise(null);
});
