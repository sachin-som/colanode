import React from 'react';
import { LocalNode } from '@/types/nodes';
import { Breadcrumb } from '@/components/workspaces/containers/breadcrumb';

interface ContainerHeaderProps {
  node: LocalNode;
}

export const ContainerHeader = ({ node }: ContainerHeaderProps) => {
  return <Breadcrumb node={node} />;
};
