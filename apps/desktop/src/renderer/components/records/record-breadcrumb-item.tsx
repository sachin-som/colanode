import { Avatar } from '@/renderer/components/avatars/avatar';
import { LocalRecordNode } from '@/shared/types/nodes';

interface RecordBreadcrumbItemProps {
  record: LocalRecordNode;
}

export const RecordBreadcrumbItem = ({ record }: RecordBreadcrumbItemProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Avatar
        id={record.id}
        name={record.attributes.name}
        avatar={record.attributes.avatar}
        className="size-4"
      />
      <span>{record.attributes.name}</span>
    </div>
  );
};
