import { FolderEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface FolderBreadcrumbItemProps {
  id: string;
}

export const FolderBreadcrumbItem = ({ id }: FolderBreadcrumbItemProps) => {
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
  const folder = data as FolderEntry;

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        id={folder.id}
        name={folder.attributes.name}
        avatar={folder.attributes.avatar}
        className="size-4"
      />
      <span>{folder.attributes.name}</span>
    </div>
  );
};
