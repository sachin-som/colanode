import React from 'react';
import { ViewCreateDialog } from '@/components/databases/view-create-dialog';
import { Icon } from '@/components/ui/icon';

export const ViewCreateButton = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <Icon
        name="add-line"
        className="mb-1 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      />
      <ViewCreateDialog open={open} onOpenChange={setOpen} />
    </React.Fragment>
  );
};
