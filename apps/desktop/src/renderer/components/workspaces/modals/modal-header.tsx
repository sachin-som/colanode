import React from 'react';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { Fullscreen } from 'lucide-react';

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
        <Fullscreen className="size-4" />
      </button>
    </div>
  );
};
