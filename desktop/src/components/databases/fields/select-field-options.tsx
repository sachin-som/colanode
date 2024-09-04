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
import { MultiSelectField, SelectField } from '@/types/databases';
import { useWorkspace } from '@/contexts/workspace';
import { useMutation } from '@tanstack/react-query';
import { NeuronId } from '@/lib/id';
import { NodeTypes } from '@/lib/constants';
import { generateNodeIndex } from '@/lib/nodes';
import { getRandomSelectOptionColor } from '@/lib/databases';
import { SelectOptionSettingsPopover } from '@/components/databases/fields/select-option-settings-popover';

interface SelectFieldOptionsProps {
  field: SelectField | MultiSelectField;
  values: string[];
  onSelect: (id: string) => void;
}

interface CreateSelectOptionInput {
  name: string;
  color: string;
}

export const SelectFieldOptions = ({
  field,
  values,
  onSelect,
}: SelectFieldOptionsProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation({
    mutationFn: async (input: CreateSelectOptionInput) => {
      const lastChildQuery = workspace.schema
        .selectFrom('nodes')
        .where((eb) =>
          eb.and({
            parent_id: field.id,
            type: NodeTypes.SelectOption,
          }),
        )
        .selectAll()
        .orderBy('index', 'desc')
        .limit(1)
        .compile();

      const result = await workspace.query(lastChildQuery);
      const lastChild =
        result.rows && result.rows.length > 0 ? result.rows[0] : null;
      const maxIndex = lastChild?.index ? lastChild.index : null;

      const index = generateNodeIndex(maxIndex, null);
      const id = NeuronId.generate(NeuronId.Type.SelectOption);
      const query = workspace.schema
        .insertInto('nodes')
        .values({
          id,
          type: NodeTypes.SelectOption,
          parent_id: field.id,
          index,
          attrs: JSON.stringify({
            name: input.name,
            color: input.color,
          }),
          content: null,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .compile();

      await workspace.mutate(query);
      return id;
    },
  });

  const [inputValue, setInputValue] = React.useState('');
  const [color, setColor] = React.useState(getRandomSelectOptionColor());
  const allowAdd = !field.options?.some(
    (option) => option.name === inputValue.trim(),
  );

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
          {allowAdd && inputValue.length > 0 && (
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

                mutate(
                  {
                    name: inputValue.trim(),
                    color,
                  },
                  {
                    onSuccess: (id) => {
                      setInputValue('');
                      setColor(getRandomSelectOptionColor());
                      onSelect(id);
                    },
                  },
                );
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
