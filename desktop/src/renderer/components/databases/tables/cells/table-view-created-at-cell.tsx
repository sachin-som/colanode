import React from 'react';
import { CreatedAtFieldAttributes } from '@/registry';
import { useRecord } from '@/renderer/contexts/record';

interface TableViewCreatedAtCellProps {
  field: CreatedAtFieldAttributes;
}

export const TableViewCreatedAtCell = ({
  field,
}: TableViewCreatedAtCellProps) => {
  const record = useRecord();

  const createdAt = new Date(record.createdAt);
  return (
    <div className="h-full w-full p-1 text-sm" data-field={field.id}>
      <p>
        {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString()}
      </p>
    </div>
  );
};
