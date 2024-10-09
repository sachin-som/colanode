import React from 'react';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { CreatedByFieldNode, RecordNode } from '@/types/databases';

interface RecordCreatedByValueProps {
  field: CreatedByFieldNode;
  record: RecordNode;
}

export const RecordCreatedByValue = ({
  field,
  record,
}: RecordCreatedByValueProps) => {
  return (
    <div
      className="flex h-full w-full flex-row items-center gap-1 p-1 text-sm"
      data-field={field.id}
    >
      <Avatar
        id={record.createdBy.id}
        name={record.createdBy.name}
        avatar={record.createdBy.avatar}
        size="small"
      />
      <p>{record.createdBy.name}</p>
    </div>
  );
};
