import { extractEntryRole } from '@colanode/core';

import { FileBody } from '@/renderer/components/files/file-body';
import { FileHeader } from '@/renderer/components/files/file-header';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface FileContainerProps {
  fileId: string;
}

export const FileContainer = ({ fileId }: FileContainerProps) => {
  const workspace = useWorkspace();

  const { data: file, isPending: isFilePending } = useQuery({
    type: 'file_get',
    id: fileId,
    userId: workspace.userId,
  });

  const { data: entries, isPending: isEntriesPending } = useQuery(
    {
      type: 'entry_tree_get',
      entryId: file?.parentId ?? '',
      userId: workspace.userId,
    },
    {
      enabled: !!file,
    }
  );

  if (isFilePending || isEntriesPending) {
    return null;
  }

  const role = extractEntryRole(entries ?? [], workspace.userId);
  if (!file || !role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <FileHeader entries={entries ?? []} file={file} role={role} />
      <FileBody file={file} />
    </div>
  );
};
