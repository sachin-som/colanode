import { Entry, EntryRole } from '@colanode/core';
import { UserRoundPlus } from 'lucide-react';

import { EntryCollaborators } from '@/renderer/components/collaborators/entry-collaborators';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';

interface EntryCollaboratorsPopoverProps {
  entryId: string;
  entries: Entry[];
  role: EntryRole;
}

export const EntryCollaboratorsPopover = ({
  entryId,
  entries,
  role,
}: EntryCollaboratorsPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <UserRoundPlus className="size-5 cursor-pointer text-muted-foreground hover:text-foreground" />
      </PopoverTrigger>
      <PopoverContent className="mr-2 max-h-128 w-128 overflow-auto">
        <EntryCollaborators entryId={entryId} entries={entries} role={role} />
      </PopoverContent>
    </Popover>
  );
};
