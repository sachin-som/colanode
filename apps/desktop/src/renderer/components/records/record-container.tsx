import { DatabaseEntry, extractEntryRole, RecordEntry } from '@colanode/core';

import { RecordBody } from '@/renderer/components/records/record-body';
import { RecordHeader } from '@/renderer/components/records/record-header';
import { RecordNotFound } from '@/renderer/components/records/record-not-found';
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
  const recordExists = !!record;

  const { data: root, isPending: isPendingRoot } = useQuery(
    {
      type: 'entry_get',
      entryId: record?.rootId ?? '',
      userId: workspace.userId,
    },
    {
      enabled: recordExists,
    }
  );

  const { data: databaseEntry, isPending: isPendingDatabase } = useQuery(
    {
      type: 'entry_get',
      entryId: record?.attributes.databaseId ?? '',
      userId: workspace.userId,
    },
    {
      enabled: recordExists,
    }
  );

  const database = databaseEntry as DatabaseEntry;

  if (isPendingEntry || isPendingRoot || isPendingDatabase) {
    return null;
  }

  if (!record || !root || !database) {
    return <RecordNotFound />;
  }

  const role = extractEntryRole(root, workspace.userId);
  if (!role) {
    return <RecordNotFound />;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <RecordHeader record={record} role={role} />
      <RecordBody record={record} database={database} role={role} />
    </div>
  );
};
