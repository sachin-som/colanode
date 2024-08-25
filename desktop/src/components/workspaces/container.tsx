import React from 'react';
import { observer } from 'mobx-react-lite';
import { match } from 'ts-pattern';
import { useParams } from 'react-router-dom';
import { NodeTypes } from '@/lib/constants';
import { PageContainerNode } from '@/components/pages/page-container-node';
import { ChannelContainerNode } from '@/components/channels/channel-container-node';
import { ContainerHeader } from '@/components/workspaces/container-header';
import { Spinner } from '@/components/ui/spinner';
import { mapNode } from '@/lib/nodes';
import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/workspace';

export const Container = observer(() => {
  const { nodeId } = useParams<{ nodeId: string }>();
  const workspace = useWorkspace();

  const { data, isPending } = useQuery({
    queryKey: [`node:${nodeId}`],
    queryFn: async ({ queryKey }) => {
      const query = workspace.schema
        .selectFrom('nodes')
        .selectAll()
        .where('id', '=', nodeId)
        .compile();

      const queryId = queryKey[0];
      return await workspace.queryAndSubscribe(queryId, query);
    },
  });

  if (isPending) {
    return <Spinner />;
  }

  if (!data || data.rows.length === 0) {
    return null;
  }

  const node = mapNode(data.rows[0]);
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
