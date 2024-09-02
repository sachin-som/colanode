import React from 'react';
import { LocalNode } from '@/types/nodes';
import { match } from 'ts-pattern';
import { SpaceSidebarNode } from '@/components/spaces/space-sidebar-node';
import { NodeTypes } from '@/lib/constants';
import { ChannelSidebarNode } from '@/components/channels/channel-sidebar-node';
import { PageSidebarNode } from '@/components/pages/page-sidebar-node';
import { DatabaseSidebarNode } from '@/components/databases/database-sidebar-node';

interface SidebarNodeProps {
  node: LocalNode;
}

export const SidebarNode = ({ node }: SidebarNodeProps): React.ReactNode => {
  return match(node.type)
    .with(NodeTypes.Space, () => <SpaceSidebarNode node={node} />)
    .with(NodeTypes.Channel, () => <ChannelSidebarNode node={node} />)
    .with(NodeTypes.Page, () => <PageSidebarNode node={node} />)
    .with(NodeTypes.Database, () => <DatabaseSidebarNode node={node} />)
    .otherwise(null);
};
