import { FolderEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface FolderContainerTabProps {
  folderId: string;
}

export const FolderContainerTab = ({ folderId }: FolderContainerTabProps) => {
  const workspace = useWorkspace();

  const { data: entry } = useQuery({
    type: 'entry_get',
    entryId: folderId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const folder = entry as FolderEntry;
  if (!folder) {
    return <p>Not found</p>;
  }

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
