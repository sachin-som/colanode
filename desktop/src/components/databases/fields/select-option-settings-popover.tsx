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
import { SelectOption } from '@/types/databases';
import { SelectOptionDeleteDialog } from '@/components/databases/fields/select-option-delete-dialog';
import { useWorkspace } from '@/contexts/workspace';
import { NeuronId } from '@/lib/id';
import { useMutation } from '@tanstack/react-query';

interface SelectOptionSettingsPopoverProps {
  option: SelectOption;
}

interface UpdateSelectOptionInput {
  name: string;
  color: string;
}

export const SelectOptionSettingsPopover = ({
  option,
}: SelectOptionSettingsPopoverProps) => {
  const workspace = useWorkspace();

  const { mutate, isPending } = useMutation({
    mutationFn: async (input: UpdateSelectOptionInput) => {
      const newAttrs = {
        name: input.name,
        color: input.color,
      };
      const query = workspace.schema
        .updateTable('nodes')
        .set({
          attrs: newAttrs ? JSON.stringify(newAttrs) : null,
          updated_at: new Date().toISOString(),
          updated_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .where('id', '=', option.id)
        .compile();

      await workspace.mutate(query);
    },
  });

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
                if (name !== option.name && !isPending) {
                  mutate({
                    name,
                    color: option.color,
                  });
                }
              }}
              onKeyDown={(e) => {
                if (isHotkey('enter', e)) {
                  if (name !== option.name && !isPending) {
                    mutate({
                      name,
                      color: option.color,
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
                  mutate({
                    name,
                    color: color.value,
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
