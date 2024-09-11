import React from 'react';
import { useDatabase } from '@/contexts/database';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { getFieldIcon } from '@/lib/databases';

interface ViewFilterFieldDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export const ViewFilterFieldDropdown = ({
  value,
  onChange,
}: ViewFilterFieldDropdownProps) => {
  const database = useDatabase();
  if (database.fields.length === 0) {
    return null;
  }

  const selectedField =
    database.fields.find((field) => field.id === value) ?? database.fields[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex flex-row items-center gap-1 px-2 py-1"
        >
          <Icon name={getFieldIcon(selectedField.dataType)} />
          <span>{selectedField.name}</span>
          <Icon name="arrow-down-s-line" className="ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mr-5 w-56">
        {database.fields.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onClick={() => {
              onChange(item.id);
            }}
          >
            <div className="flex w-full flex-row items-center gap-2">
              <Icon name={getFieldIcon(item.dataType)} />
              <p className="flex-grow">{item.name}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
