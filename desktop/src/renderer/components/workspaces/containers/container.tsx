import React from 'react';
import { match } from 'ts-pattern';
import { useParams } from 'react-router-dom';
import { PageContainerNode } from '@/renderer/components/pages/page-container-node';
import { ChannelContainerNode } from '@/renderer/components/channels/channel-container-node';
import { ContainerHeader } from '@/renderer/components/workspaces/containers/container-header';
import { DatabaseContainerNode } from '@/renderer/components/databases/database-container-node';
import { RecordContainerNode } from '@/renderer/components/records/record-container-node';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { getIdType, IdType } from '@/lib/id';

export const Container = () => {
  const workspace = useWorkspace();
  const { nodeId } = useParams<{ nodeId: string }>();
  if (!nodeId) {
    return null;
  }

  const idType = getIdType(nodeId);
  return (
    <div className="flex h-full w-full flex-col">
      <ContainerHeader nodeId={nodeId} />
      {match(idType)
        .with(IdType.Channel, () => <ChannelContainerNode nodeId={nodeId} />)
        .with(IdType.Page, () => <PageContainerNode nodeId={nodeId} />)
        .with(IdType.Database, () => <DatabaseContainerNode nodeId={nodeId} />)
        .with(IdType.Record, () => <RecordContainerNode nodeId={nodeId} />)
        .otherwise(() => null)}
    </div>
  );
};
