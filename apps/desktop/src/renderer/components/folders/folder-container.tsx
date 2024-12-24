import { extractEntryRole } from '@colanode/core';

import { FolderBody } from '@/renderer/components/folders/folder-body';
import { FolderHeader } from '@/renderer/components/folders/folder-header';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface FolderContainerProps {
  folderId: string;
}

export const FolderContainer = ({ folderId }: FolderContainerProps) => {
  const workspace = useWorkspace();

  const { data, isPending } = useQuery({
    type: 'entry_tree_get',
    entryId: folderId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  const entries = data ?? [];
  const folder = entries.find((entry) => entry.id === folderId);
  const role = extractEntryRole(entries, workspace.userId);

  if (!folder || folder.type !== 'folder' || !role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <FolderHeader entries={entries} folder={folder} role={role} />
      <FolderBody folder={folder} />
    </div>
  );
};
