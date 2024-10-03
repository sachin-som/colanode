import React from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/renderer/components/ui/popover';
import { Icon } from '@/renderer/components/ui/icon';
import { NodeCollaborators } from '@/renderer/components/collaborators/node-collaborators';

interface NodeCollaboratorsPopoverProps {
  id: string;
}

export const NodeCollaboratorsPopover = ({
  id,
}: NodeCollaboratorsPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Icon
          name="user-add-line"
          className="h-5 w-5 cursor-pointer text-muted-foreground"
        />
      </PopoverTrigger>
      <PopoverContent className="mr-2 max-h-128 w-128 overflow-auto">
        <NodeCollaborators id={id} />
      </PopoverContent>
    </Popover>
  );
};
