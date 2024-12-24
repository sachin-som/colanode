import { extractEntryRole } from '@colanode/core';

import { RecordBody } from '@/renderer/components/records/record-body';
import { RecordHeader } from '@/renderer/components/records/record-header';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface RecordContainerProps {
  recordId: string;
}

export const RecordContainer = ({ recordId }: RecordContainerProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    type: 'entry_tree_get',
    entryId: recordId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  const entries = data ?? [];
  const record = entries.find((entry) => entry.id === recordId);
  if (!record || record.type !== 'record') {
    return null;
  }

  const databaseIndex = entries.findIndex(
    (entry) => entry.id === record.attributes.databaseId
  );
  if (databaseIndex === -1) {
    return null;
  }

  const database = entries[databaseIndex];
  if (!database || database.type !== 'database') {
    return null;
  }

  const databaseAncestors = entries.slice(0, databaseIndex);

  const recordRole = extractEntryRole(entries, workspace.userId);
  const databaseRole = extractEntryRole(
    [...databaseAncestors, database],
    workspace.userId
  );

  if (!recordRole || !databaseRole) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <RecordHeader entries={entries} record={record} role={recordRole} />
      <RecordBody
        record={record}
        recordRole={recordRole}
        database={database}
        databaseRole={databaseRole}
      />
    </div>
  );
};
