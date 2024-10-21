import React from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/renderer/components/ui/popover';
import { Icon } from '@/renderer/components/ui/icon';
import { NodeCollaborators } from '@/renderer/components/collaborators/node-collaborators';

interface NodeCollaboratorsPopoverProps {
  nodeId: string;
}

export const NodeCollaboratorsPopover = ({
  nodeId,
}: NodeCollaboratorsPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Icon
          name="user-add-line"
          className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground"
        />
      </PopoverTrigger>
      <PopoverContent className="mr-2 max-h-128 w-128 overflow-auto">
        <NodeCollaborators nodeId={nodeId} />
      </PopoverContent>
    </Popover>
  );
};
