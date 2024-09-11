import React from 'react';
import { ViewFilterNode } from '@/types/databases';
import { ViewFilterFieldDropdown } from '@/components/databases/filters/view-filter-field-dropdown';
import { ViewFilterOperatorDropdown } from '@/components/databases/filters/view-filter-operator-dropdown';
import { Icon } from '@/components/ui/icon';
import { useDatabase } from '@/contexts/database';
import { getFieldFilterOperators } from '@/lib/databases';

interface ViewFilterProps {
  filter: ViewFilterNode;
  onChange: (filter: ViewFilterNode) => void;
  onRemove: () => void;
}

export const ViewFilter = ({ filter, onChange, onRemove }: ViewFilterProps) => {
  const database = useDatabase();
  const field = database.fields.find((field) => field.id === filter.fieldId);
  if (!field) {
    return null;
  }

  const operators = getFieldFilterOperators(field.dataType);
  if (operators.length === 0) {
    return null;
  }

  const operator =
    operators.find((operator) => operator.value === filter.operator) ??
    operators[0];

  const showInput = true;
  return (
    <div className="flex flex-row gap-2 p-1">
      <ViewFilterFieldDropdown
        value={filter.fieldId}
        onChange={(field) => {
          onChange({
            ...filter,
            fieldId: field,
          });
        }}
      />
      <ViewFilterOperatorDropdown
        operators={operators}
        value={operator}
        onChange={(operator) => {
          onChange({
            ...filter,
            operator: operator.value,
          });
        }}
      />
      <div className="flex-1">
        {/* {showInput && (
          <FieldFilterInput
            field={field}
            filter={filter}
            setFilter={onChange}
          />
        )} */}
        <p>input</p>
      </div>
      <div
        role="presentation"
        className="ml-auto flex cursor-pointer items-center text-muted-foreground"
        onClick={onRemove}
      >
        <Icon name="delete-bin-line" />
      </div>
    </div>
  );
};
