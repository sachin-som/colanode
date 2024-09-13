import React from 'react';
import { CreatedAtFieldNode, RecordNode } from '@/types/databases';

interface RecordCreatedAtValueProps {
  record: RecordNode;
  field: CreatedAtFieldNode;
}

export const RecordCreatedAtValue = ({
  record,
  field,
}: RecordCreatedAtValueProps) => {
  return (
    <div className="h-full w-full p-1 text-sm" data-field={field.id}>
      <p>
        {record.createdAt.toLocaleDateString()}{' '}
        {record.createdAt.toLocaleTimeString()}
      </p>
    </div>
  );
};
