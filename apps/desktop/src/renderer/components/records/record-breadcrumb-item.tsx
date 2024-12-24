import { RecordEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';

interface RecordBreadcrumbItemProps {
  record: RecordEntry;
}

export const RecordBreadcrumbItem = ({ record }: RecordBreadcrumbItemProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Avatar
        size="small"
        id={record.id}
        name={record.attributes.name}
        avatar={record.attributes.avatar}
      />
      <span>{record.attributes.name}</span>
    </div>
  );
};
