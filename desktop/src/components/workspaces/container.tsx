import React from 'react';
import { observer } from 'mobx-react-lite';
import { match } from 'ts-pattern';
import { NodeTypes } from '@/lib/constants';
import { PageContainerNode } from '@/components/pages/page-container-node';
import { ChannelContainerNode } from '@/components/channels/channel-container-node';
import { ContainerHeader } from '@/components/workspaces/container-header';
import { useParams } from 'react-router-dom';
import { useContainer } from '@/hooks/use-container';

export const Container = observer(() => {
  const { nodeId } = useParams<{ nodeId: string }>();
  const { node } = useContainer(nodeId);

  if (!node) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <ContainerHeader node={node} />
      {match(node.type)
        .with(NodeTypes.Channel, () => <ChannelContainerNode node={node} />)
        .with(NodeTypes.Page, () => <PageContainerNode node={node} />)
        .otherwise(null)}
    </div>
  );
});
