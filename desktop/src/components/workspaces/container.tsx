import React from "react";
import { observer } from "mobx-react-lite";
import { useWorkspace } from "@/contexts/workspace";
import {match} from "ts-pattern";
import {NodeTypes} from "@/lib/constants";
import {PageContainerNode} from "@/components/pages/page-container-node";
import {ChannelContainerNode} from "@/components/channels/channel-container-node";

interface ContainerProps {
  nodeId: string;
}

export const Container = observer(({nodeId}: ContainerProps) => {
  const workspace = useWorkspace();
  const node = workspace.getNodes().find(node => node.id === nodeId);
  if (node == null) {
    return <p>Node not found.</p>
  }

  return (
    <div className="flex flex-col">
      <p className="h-12">Header</p>
      {match(node.type)
        .with(NodeTypes.Channel, () => <ChannelContainerNode node={node} />)
        .with(NodeTypes.Page, () => <PageContainerNode node={node} />)
        .otherwise(null)}
    </div>
  )
});