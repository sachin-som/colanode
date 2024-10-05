import React from 'react';
import { match } from 'ts-pattern';
import { ChannelContainerNode } from '@/renderer/components/channels/channel-container-node';
import { PageContainerNode } from '@/renderer/components/pages/page-container-node';
import { DatabaseContainerNode } from '@/renderer/components/databases/database-container-node';
import { RecordContainerNode } from '@/renderer/components/records/record-container-node';
import { getIdType, IdType } from '@/lib/id';

interface ModalContentProps {
  nodeId: string;
}

export const ModalContent = ({ nodeId }: ModalContentProps) => {
  const idType = getIdType(nodeId);
  return (
    <div className="flex h-full w-full flex-col">
      {match(idType)
        .with(IdType.Channel, () => <ChannelContainerNode nodeId={nodeId} />)
        .with(IdType.Page, () => <PageContainerNode nodeId={nodeId} />)
        .with(IdType.Database, () => <DatabaseContainerNode nodeId={nodeId} />)
        .with(IdType.Record, () => <RecordContainerNode nodeId={nodeId} />)
        .otherwise(() => null)}
    </div>
  );
};
