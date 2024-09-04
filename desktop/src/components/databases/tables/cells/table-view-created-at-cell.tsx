import { CreatedAtField, RecordNode } from '@/types/databases';
import React from 'react';

interface TableViewCreatedAtCellProps {
  record: RecordNode;
  field: CreatedAtField;
}

export const TableViewCreatedAtCell = ({
  record,
  field,
}: TableViewCreatedAtCellProps) => {
  return (
    <div className="h-full w-full p-1 text-sm" data-field={field.id}>
      <p>
        {record.createdAt.toLocaleDateString()}{' '}
        {record.createdAt.toLocaleTimeString()}
      </p>
    </div>
  );
};
