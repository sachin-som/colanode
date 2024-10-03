import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { useQuery } from '@/renderer/hooks/use-query';
import { match } from 'ts-pattern';
import { NodeTypes } from '@/lib/constants';
import { ChannelContainerNode } from '@/components/channels/channel-container-node';
import { PageContainerNode } from '@/components/pages/page-container-node';
import { DatabaseContainerNode } from '@/components/databases/database-container-node';
import { RecordContainerNode } from '@/components/records/record-container-node';
import { useWorkspace } from '@/contexts/workspace';

interface ModalContentProps {
  nodeId: string;
}

export const ModalContent = ({ nodeId }: ModalContentProps) => {
  const workspace = useWorkspace();
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
      {match(data.type)
        .with(NodeTypes.Channel, () => <ChannelContainerNode node={data} />)
        .with(NodeTypes.Page, () => <PageContainerNode node={data} />)
        .with(NodeTypes.Database, () => <DatabaseContainerNode node={data} />)
        .with(NodeTypes.Record, () => <RecordContainerNode node={data} />)
        .otherwise(() => null)}
    </div>
  );
};
