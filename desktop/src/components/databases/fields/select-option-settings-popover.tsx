import React from 'react';
import isHotkey from 'is-hotkey';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { selectOptionColors } from '@/lib/databases';
import { cn } from '@/lib/utils';
import { SelectOptionNode } from '@/types/databases';
import { SelectOptionDeleteDialog } from '@/components/databases/fields/select-option-delete-dialog';
import { useNodeUpdateNameMutation } from '@/mutations/use-node-update-name-mutation';
import { useUpdateSelectOptionColorMutation } from '@/mutations/use-update-select-option-color-mutation';

interface SelectOptionSettingsPopoverProps {
  option: SelectOptionNode;
}

interface UpdateSelectOptionInput {
  name: string;
  color: string;
}

export const SelectOptionSettingsPopover = ({
  option,
}: SelectOptionSettingsPopoverProps) => {
  const nameMutation = useNodeUpdateNameMutation();
  const colorMutation = useUpdateSelectOptionColorMutation();

  const [name, setName] = React.useState(option.name);
  const [openSetttingsPopover, setOpenSetttingsPopover] = React.useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);

  return (
    <React.Fragment>
      <Popover
        modal={true}
        open={openSetttingsPopover}
        onOpenChange={setOpenSetttingsPopover}
      >
        <PopoverTrigger asChild>
          <Icon name="more-line" />
        </PopoverTrigger>
        <PopoverContent className="ml-1 flex w-72 flex-col gap-1 p-2 text-sm">
          <div className="p-1">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              onBlur={() => {
                if (name !== option.name && !nameMutation.isPending) {
                  nameMutation.mutate({
                    id: option.id,
                    name,
                  });
                }
              }}
              onKeyDown={(e) => {
                if (isHotkey('enter', e)) {
                  if (name !== option.name && !nameMutation.isPending) {
                    nameMutation.mutate({
                      id: option.id,
                      name,
                    });
                  }
                  e.preventDefault();
                }
              }}
            />
          </div>
          <Separator className="my-1" />
          <Label>Color</Label>
          {selectOptionColors.map((color) => {
            return (
              <div
                key={color.value}
                className="flex cursor-pointer flex-row items-center gap-2 rounded-md p-1 hover:bg-gray-100"
                onClick={() => {
                  if (
                    color.value !== option.color &&
                    !colorMutation.isPending
                  ) {
                    colorMutation.mutate({
                      id: option.id,
                      color: color.value,
                    });
                  }
                }}
              >
                <span className={cn('h-4 w-4 rounded-md', color.class)} />
                <span>{color.label}</span>
              </div>
            );
          })}
          <Separator className="my-1" />
          <div
            className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
            onClick={() => {
              setOpenDeleteDialog(true);
              setOpenSetttingsPopover(false);
            }}
          >
            <Icon name="delete-bin-line" />
            <span>Delete option</span>
          </div>
        </PopoverContent>
      </Popover>
      <SelectOptionDeleteDialog
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        id={option.id}
      />
    </React.Fragment>
  );
};
