import React from 'react';
import { Icon } from '@/renderer/components/ui/icon';
import { Label } from '@/renderer/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { Separator } from '@/renderer/components/ui/separator';
import { selectOptionColors } from '@/lib/databases';
import { cn } from '@/lib/utils';
import { SelectOptionNode } from '@/types/databases';
import { SelectOptionDeleteDialog } from '@/renderer/components/databases/fields/select-option-delete-dialog';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { SmartTextInput } from '@/renderer/components/ui/smart-text-input';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface SelectOptionSettingsPopoverProps {
  option: SelectOptionNode;
}

export const SelectOptionSettingsPopover = ({
  option,
}: SelectOptionSettingsPopoverProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

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
            <SmartTextInput
              value={option.name}
              onChange={(newName) => {
                if (isPending) return;
                if (newName === option.name) return;

                mutate({
                  input: {
                    type: 'node_attribute_set',
                    nodeId: option.id,
                    attribute: 'name',
                    value: newName,
                    userId: workspace.userId,
                  },
                });
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
                  if (isPending) return;

                  mutate({
                    input: {
                      type: 'node_attribute_set',
                      nodeId: option.id,
                      attribute: 'color',
                      value: color.value,
                      userId: workspace.userId,
                    },
                  });
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
