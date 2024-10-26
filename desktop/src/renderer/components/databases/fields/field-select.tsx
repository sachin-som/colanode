import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { Button } from '@/renderer/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/renderer/components/ui/command';
import { Icon } from '@/renderer/components/ui/icon';
import { getFieldIcon } from '@/lib/databases';
import { FieldDataType, FieldNode } from '@/types/databases';
import { cn } from '@/lib/utils';

interface FieldSelectProps {
  fields: FieldNode[];
  value: string | null;
  onChange: (field: string) => void;
}

export const FieldSelect = ({ fields, value, onChange }: FieldSelectProps) => {
  const [open, setOpen] = React.useState(false);
  const selectedField = fields.find((field) => field.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between p-2"
        >
          <span className="flex flex-row items-center gap-1">
            <Icon
              name={getFieldIcon(selectedField?.dataType as FieldDataType)}
            />
            {value ? selectedField?.name : 'Select field...'}
          </span>
          <Icon
            name="expand-up-down-line"
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-1">
        <Command className="min-h-min">
          <CommandInput placeholder="Search field types..." className="h-9" />
          <CommandEmpty>No field type found.</CommandEmpty>
          <CommandList>
            <CommandGroup className="h-min max-h-96">
              {fields.map((field) => (
                <CommandItem
                  key={field.id}
                  onSelect={() => {
                    onChange(field.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex w-full flex-row items-center gap-2">
                    <Icon name={getFieldIcon(field.dataType)} />
                    <p>{field.name}</p>
                    <Icon
                      name="check-line"
                      className={cn(
                        'ml-auto h-4 w-4',
                        value === field.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
