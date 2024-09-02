import React from 'react';
import { SpaceCreateDialog } from '@/components/spaces/space-create-dialog';
import { Icon } from '@/components/ui/icon';

export const SpaceCreateButton = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <Icon
        name="add-line"
        className="mr-2 h-3 w-3 cursor-pointer"
        onClick={() => setOpen(true)}
      />
      <SpaceCreateDialog open={open} onOpenChange={setOpen} />
    </React.Fragment>
  );
};
