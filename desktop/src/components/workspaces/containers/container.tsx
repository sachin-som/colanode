import React from 'react';
import { match } from 'ts-pattern';
import { useParams } from 'react-router-dom';
import { NodeTypes } from '@/lib/constants';
import { PageContainerNode } from '@/components/pages/page-container-node';
import { ChannelContainerNode } from '@/components/channels/channel-container-node';
import { ContainerHeader } from '@/components/workspaces/containers/container-header';
import { Spinner } from '@/components/ui/spinner';
import { DatabaseContainerNode } from '@/components/databases/database-container-node';
import { useQuery } from '@/renderer/hooks/use-query';
import { RecordContainerNode } from '@/components/records/record-container-node';
import { useWorkspace } from '@/contexts/workspace';

export const Container = () => {
  const workspace = useWorkspace();
  const { nodeId } = useParams<{ nodeId: string }>();
  const { data, isPending } = useQuery({
    type: 'node_get',
    nodeId: nodeId,
    userId: workspace.userId,
  });

  if (isPending) {
    return <Spinner />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <ContainerHeader node={data} />
      {match(data.type)
        .with(NodeTypes.Channel, () => <ChannelContainerNode node={data} />)
        .with(NodeTypes.Page, () => <PageContainerNode node={data} />)
        .with(NodeTypes.Database, () => <DatabaseContainerNode node={data} />)
        .with(NodeTypes.Record, () => <RecordContainerNode node={data} />)
        .otherwise(() => null)}
    </div>
  );
};
