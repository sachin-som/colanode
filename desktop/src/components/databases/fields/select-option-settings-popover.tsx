import React from 'react';
import { Icon } from '@/components/ui/icon';
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
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import { SmartTextInput } from '@/components/ui/smart-text-input';
import { AttributeTypes } from '@/lib/constants';

interface SelectOptionSettingsPopoverProps {
  option: SelectOptionNode;
}

export const SelectOptionSettingsPopover = ({
  option,
}: SelectOptionSettingsPopoverProps) => {
  const { mutate, isPending } = useNodeAttributeUpsertMutation();

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
                  nodeId: option.id,
                  type: AttributeTypes.Name,
                  key: '1',
                  textValue: newName,
                  numberValue: null,
                  foreignNodeId: null,
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
                    nodeId: option.id,
                    type: AttributeTypes.Color,
                    key: '1',
                    textValue: color.value,
                    numberValue: null,
                    foreignNodeId: null,
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
