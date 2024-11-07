import React from 'react';
import { FieldAttributes } from '@colanode/core';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { FieldRenameInput } from '@/renderer/components/databases/fields/field-rename-input';
import { Separator } from '@/renderer/components/ui/separator';
import { FieldDeleteDialog } from '@/renderer/components/databases/fields/field-delete-dialog';
import { FieldIcon } from '@/renderer/components/databases/fields/field-icon';
import { Trash2 } from 'lucide-react';

interface RecordFieldProps {
  field: FieldAttributes;
}

export const RecordField = ({ field }: RecordFieldProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const canEditDatabase = true;

  return (
    <React.Fragment>
      <Popover modal={true}>
        <PopoverTrigger asChild>
          <div className="flex h-8 w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm hover:bg-gray-50">
            <FieldIcon type={field.type} className="size-4" />
            <p>{field.name}</p>
          </div>
        </PopoverTrigger>
        <PopoverContent className="ml-1 flex w-72 flex-col gap-1 p-2 text-sm">
          <FieldRenameInput field={field} />
          <Separator />
          {canEditDatabase && (
            <div
              className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
              onClick={() => {
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 className="size-4" />
              <span>Delete field</span>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {showDeleteDialog && (
        <FieldDeleteDialog
          id={field.id}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
        />
      )}
    </React.Fragment>
  );
};
