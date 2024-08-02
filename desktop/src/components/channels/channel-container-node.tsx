import React from 'react';
import {Node} from '@/types/nodes'

interface ChannelContainerNodeProps {
  node: Node;
}

export const ChannelContainerNode = ({node}: ChannelContainerNodeProps) => {
  return (
    <div>
      <p>Channel Container Node</p>
    </div>
  )
}