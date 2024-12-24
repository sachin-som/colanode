import { FolderEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';

interface FolderBreadcrumbItemProps {
  folder: FolderEntry;
}

export const FolderBreadcrumbItem = ({ folder }: FolderBreadcrumbItemProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Avatar
        size="small"
        id={folder.id}
        name={folder.attributes.name}
        avatar={folder.attributes.avatar}
      />
      <span>{folder.attributes.name}</span>
    </div>
  );
};
