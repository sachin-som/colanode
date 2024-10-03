import React from 'react';
import { Spinner } from '@/renderer/components/ui/spinner';
import { useQuery } from '@/renderer/hooks/use-query';
import { match } from 'ts-pattern';
import { NodeTypes } from '@/lib/constants';
import { ChannelContainerNode } from '@/renderer/components/channels/channel-container-node';
import { PageContainerNode } from '@/renderer/components/pages/page-container-node';
import { DatabaseContainerNode } from '@/renderer/components/databases/database-container-node';
import { RecordContainerNode } from '@/renderer/components/records/record-container-node';
import { useWorkspace } from '@/renderer/contexts/workspace';

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
