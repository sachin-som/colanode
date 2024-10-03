import React from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { SelectOptionBadge } from '@/components/databases/fields/select-option-badge';
import { Icon } from '@/components/ui/icon';
import { MultiSelectFieldNode, SelectFieldNode } from '@/types/databases';
import { getRandomSelectOptionColor } from '@/lib/databases';
import { SelectOptionSettingsPopover } from '@/components/databases/fields/select-option-settings-popover';
import { useWorkspace } from '@/contexts/workspace';
import { useMutation } from '@/hooks/use-mutation';

interface SelectFieldOptionsProps {
  field: SelectFieldNode | MultiSelectFieldNode;
  values: string[];
  onSelect: (id: string) => void;
  allowAdd: boolean;
}

export const SelectFieldOptions = ({
  field,
  values,
  onSelect,
  allowAdd,
}: SelectFieldOptionsProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const [inputValue, setInputValue] = React.useState('');
  const [color, setColor] = React.useState(getRandomSelectOptionColor());
  const showNewOption =
    allowAdd &&
    !field.options?.some((option) => option.name === inputValue.trim());

  return (
    <Command className="min-h-min">
      <CommandInput
        placeholder="Search options..."
        className="h-9"
        value={inputValue}
        onValueChange={setInputValue}
      />
      <CommandEmpty>No options found.</CommandEmpty>
      <CommandList>
        <CommandGroup className="h-min max-h-96">
          {field.options?.map((option) => {
            const isSelected = values.includes(option.id);
            return (
              <CommandItem
                key={option.id}
                value={option.name}
                onSelect={() => {
                  onSelect(option.id);
                }}
                className="group flex w-full cursor-pointer flex-row items-center gap-1"
              >
                <div className="flex-1">
                  <SelectOptionBadge name={option.name} color={option.color} />
                </div>
                <div className="flex flex-row items-center gap-2">
                  {isSelected ? (
                    <React.Fragment>
                      <Icon
                        name="check-line"
                        className="h-4 w-4 group-hover:hidden"
                      />
                      <Icon
                        name="close-line"
                        className="hidden h-4 w-4 group-hover:block"
                      />
                    </React.Fragment>
                  ) : (
                    <Icon
                      name="add-line"
                      className="hidden h-4 w-4 group-hover:block"
                    />
                  )}
                </div>
                <div
                  className="opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <SelectOptionSettingsPopover option={option} />
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandGroup>
          {showNewOption && inputValue.length > 0 && (
            <CommandItem
              key={inputValue.trim()}
              value={inputValue.trim()}
              onSelect={() => {
                if (isPending) {
                  return;
                }

                if (inputValue.trim().length === 0) {
                  return;
                }

                mutate({
                  input: {
                    type: 'select_option_create',
                    fieldId: field.id,
                    name: inputValue.trim(),
                    color,
                    userId: workspace.userId,
                  },
                  onSuccess(output) {
                    setInputValue('');
                    setColor(getRandomSelectOptionColor());
                    onSelect(output.id);
                  },
                });
              }}
              className="flex flex-row items-center gap-2"
            >
              <span className="text-xs text-muted-foreground">Create</span>
              <SelectOptionBadge name={inputValue} color={color} />
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};
