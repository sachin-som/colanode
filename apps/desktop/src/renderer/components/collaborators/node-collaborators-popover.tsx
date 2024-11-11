import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/renderer/components/ui/popover';
import { NodeCollaborators } from '@/renderer/components/collaborators/node-collaborators';
import { UserRoundPlus } from 'lucide-react';
import { Node } from '@colanode/core';
interface NodeCollaboratorsPopoverProps {
  nodeId: string;
  nodes: Node[];
}

export const NodeCollaboratorsPopover = ({
  nodeId,
  nodes,
}: NodeCollaboratorsPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <UserRoundPlus className="size-5 cursor-pointer text-muted-foreground hover:text-foreground" />
      </PopoverTrigger>
      <PopoverContent className="mr-2 max-h-128 w-128 overflow-auto">
        <NodeCollaborators nodeId={nodeId} nodes={nodes} />
      </PopoverContent>
    </Popover>
  );
};
