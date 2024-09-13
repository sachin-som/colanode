import React from 'react';
import { Icon } from '@/components/ui/icon';
import { useWorkspace } from '@/contexts/workspace';

interface ModalHeaderProps {
  nodeId: string;
}

export const ModalHeader = ({ nodeId }: ModalHeaderProps) => {
  const workspace = useWorkspace();
  return (
    <div className="flex h-10 min-h-10 items-center justify-between bg-white p-2">
      <button
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => workspace.navigateToNode(nodeId)}
      >
        <Icon name="fullscreen-exit-line" />
      </button>
    </div>
  );
};
