import { DatabaseEntry, extractEntryRole, RecordEntry } from '@colanode/core';

import { RecordBody } from '@/renderer/components/records/record-body';
import { RecordHeader } from '@/renderer/components/records/record-header';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface RecordContainerProps {
  recordId: string;
}

export const RecordContainer = ({ recordId }: RecordContainerProps) => {
  const workspace = useWorkspace();

  const { data: entry, isPending: isPendingEntry } = useQuery({
    type: 'entry_get',
    entryId: recordId,
    userId: workspace.userId,
  });

  const record = entry as RecordEntry;

  const { data: root, isPending: isPendingRoot } = useQuery(
    {
      type: 'entry_get',
      entryId: record?.rootId ?? '',
      userId: workspace.userId,
    },
    {
      enabled: !!record?.rootId,
    }
  );

  const { data: databaseEntry, isPending: isPendingDatabase } = useQuery(
    {
      type: 'entry_get',
      entryId: record?.attributes.databaseId ?? '',
      userId: workspace.userId,
    },
    {
      enabled: !!record?.attributes.databaseId,
    }
  );

  const database = databaseEntry as DatabaseEntry;

  if (isPendingEntry || isPendingRoot || isPendingDatabase) {
    return null;
  }

  if (!record || !root || !database) {
    return null;
  }

  const role = extractEntryRole(root, workspace.userId);
  if (!role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <RecordHeader record={record} role={role} />
      <RecordBody record={record} database={database} role={role} />
    </div>
  );
};
