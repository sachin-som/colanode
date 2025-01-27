import { RecordEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface RecordBreadcrumbItemProps {
  id: string;
}

export const RecordBreadcrumbItem = ({ id }: RecordBreadcrumbItemProps) => {
  const workspace = useWorkspace();
  const { data } = useQuery({
    type: 'entry_get',
    entryId: id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });
  if (!data) {
    return null;
  }
  const record = data as RecordEntry;
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
