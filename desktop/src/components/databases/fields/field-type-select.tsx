import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Icon } from '@/components/ui/icon';
import { getFieldIcon } from '@/lib/databases';
import { FieldType } from '@/types/databases';
import { cn } from '@/lib/utils';

interface FieldTypeOption {
  name: string;
  type: FieldType;
}

const fieldTypes: FieldTypeOption[] = [
  {
    name: 'Boolean',
    type: 'boolean',
  },
  {
    name: 'Collaborator',
    type: 'collaborator',
  },
  {
    name: 'Created Date & Time',
    type: 'created_at',
  },
  {
    name: 'Created by user',
    type: 'created_by',
  },
  {
    name: 'Date',
    type: 'date',
  },
  {
    name: 'Email',
    type: 'email',
  },
  {
    name: 'File',
    type: 'file',
  },
  {
    name: 'Multi Select',
    type: 'multi_select',
  },
  {
    name: 'Number',
    type: 'number',
  },
  {
    name: 'Phone',
    type: 'phone',
  },
  {
    name: 'Select',
    type: 'select',
  },
  {
    name: 'Text',
    type: 'text',
  },
  {
    name: 'Url',
    type: 'url',
  },
];

interface FieldTypeSelectProps {
  type: string | null;
  onChange: (type: FieldType) => void;
}

export const FieldTypeSelect = ({ type, onChange }: FieldTypeSelectProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between p-2"
        >
          <span className="flex flex-row items-center gap-1">
            <Icon name={getFieldIcon(type as FieldType)} />
            {type
              ? fieldTypes.find((fieldType) => fieldType.type === type)?.name
              : 'Select field type...'}
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
              {fieldTypes.map((fieldType) => (
                <CommandItem
                  key={fieldType.type}
                  onSelect={() => {
                    onChange(fieldType.type);
                    setOpen(false);
                  }}
                >
                  <div className="flex w-full flex-row items-center gap-2">
                    <Icon name={getFieldIcon(fieldType.type)} />
                    <p>{fieldType.name}</p>
                    <Icon
                      name="check-line"
                      className={cn(
                        'ml-auto h-4 w-4',
                        type === fieldType.type ? 'opacity-100' : 'opacity-0',
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
