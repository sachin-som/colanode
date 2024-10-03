import React from 'react';
import { FieldNode } from '@/types/databases';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { Icon } from '@/renderer/components/ui/icon';
import { getFieldIcon } from '@/lib/databases';
import { FieldRenameInput } from '@/renderer/components/databases/fields/field-rename-input';
import { Separator } from '@/renderer/components/ui/separator';
import { FieldDeleteDialog } from '@/renderer/components/databases/fields/field-delete-dialog';

interface RecordFieldProps {
  field: FieldNode;
}

export const RecordField = ({ field }: RecordFieldProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const canEditDatabase = true;

  return (
    <React.Fragment>
      <Popover modal={true}>
        <PopoverTrigger asChild>
          <div className="flex h-8 w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm hover:bg-gray-50">
            <Icon name={getFieldIcon(field.dataType)} />
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
              <Icon name="delete-bin-line" />
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
