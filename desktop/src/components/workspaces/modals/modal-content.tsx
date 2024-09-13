import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { useNodeQuery } from '@/queries/use-node-query';
import { mapNode } from '@/lib/nodes';
import { match } from 'ts-pattern';
import { NodeTypes } from '@/lib/constants';
import { ChannelContainerNode } from '@/components/channels/channel-container-node';
import { PageContainerNode } from '@/components/pages/page-container-node';
import { DatabaseContainerNode } from '@/components/databases/database-container-node';
import { RecordContainerNode } from '@/components/records/record-container-node';

interface ModalContentProps {
  nodeId: string;
}

export const ModalContent = ({ nodeId }: ModalContentProps) => {
  const { data, isPending } = useNodeQuery(nodeId);

  if (isPending) {
    return <Spinner />;
  }

  if (!data || data.rows.length === 0) {
    return null;
  }

  const node = mapNode(data.rows[0]);

  return (
    <div className="flex h-full w-full flex-col">
      {match(node.type)
        .with(NodeTypes.Channel, () => <ChannelContainerNode node={node} />)
        .with(NodeTypes.Page, () => <PageContainerNode node={node} />)
        .with(NodeTypes.Database, () => <DatabaseContainerNode node={node} />)
        .with(NodeTypes.Record, () => <RecordContainerNode node={node} />)
        .otherwise(() => null)}
    </div>
  );
};
