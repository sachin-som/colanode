import { extractEntryRole } from '@colanode/core';

import { FileBody } from '@/renderer/components/files/file-body';
import { FileHeader } from '@/renderer/components/files/file-header';
import { FileNotFound } from '@/renderer/components/files/file-not-found';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface FileContainerProps {
  fileId: string;
}

export const FileContainer = ({ fileId }: FileContainerProps) => {
  const workspace = useWorkspace();

  const { data: file, isPending: isPendingFile } = useQuery({
    type: 'file_get',
    id: fileId,
    userId: workspace.userId,
  });

  const fileExists = !!file;

  const { data: entry, isPending: isPendingEntry } = useQuery(
    {
      type: 'entry_get',
      entryId: file?.entryId ?? '',
      userId: workspace.userId,
    },
    {
      enabled: fileExists,
    }
  );

  const { data: root, isPending: isPendingRoot } = useQuery(
    {
      type: 'entry_get',
      entryId: file?.rootId ?? '',
      userId: workspace.userId,
    },
    {
      enabled: fileExists,
    }
  );

  if (
    isPendingFile ||
    (isPendingEntry && fileExists) ||
    (isPendingRoot && fileExists)
  ) {
    return null;
  }

  if (!file || !entry || !root) {
    return <FileNotFound />;
  }

  const role = extractEntryRole(root, workspace.userId);
  if (!role) {
    return <FileNotFound />;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <FileHeader file={file} role={role} entry={entry} />
      <FileBody file={file} />
    </div>
  );
};
