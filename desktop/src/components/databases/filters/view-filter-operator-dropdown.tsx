import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { FieldFilterOperator } from '@/lib/databases';

interface ViewFilterOperatorDropdownProps {
  operators: FieldFilterOperator[];
  value: FieldFilterOperator;
  onChange: (value: FieldFilterOperator) => void;
}

export const ViewFilterOperatorDropdown = ({
  operators,
  value,
  onChange,
}: ViewFilterOperatorDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex flex-row items-center gap-1 px-2 py-1"
        >
          <span>{value.label}</span>
          <Icon name="arrow-down-s-line" className="ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mr-5 w-56">
        {operators.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onClick={() => {
              onChange(item);
            }}
          >
            <div className="flex w-full flex-row items-center gap-2">
              <p className="flex-grow">{item.label}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
