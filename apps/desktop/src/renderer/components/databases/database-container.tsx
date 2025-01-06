import { DatabaseEntry, extractEntryRole } from '@colanode/core';

import { DatabaseBody } from '@/renderer/components/databases/database-body';
import { DatabaseHeader } from '@/renderer/components/databases/database-header';
import { DatabaseNotFound } from '@/renderer/components/databases/database-not-found';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface DatabaseContainerProps {
  databaseId: string;
}

export const DatabaseContainer = ({ databaseId }: DatabaseContainerProps) => {
  const workspace = useWorkspace();

  const { data: entry, isPending: isPendingEntry } = useQuery({
    type: 'entry_get',
    entryId: databaseId,
    userId: workspace.userId,
  });

  const database = entry as DatabaseEntry;
  const databaseExists = !!database;

  const { data: root, isPending: isPendingRoot } = useQuery(
    {
      type: 'entry_get',
      entryId: database?.rootId ?? '',
      userId: workspace.userId,
    },
    {
      enabled: databaseExists,
    }
  );

  if (isPendingEntry || (isPendingRoot && databaseExists)) {
    return null;
  }

  if (!database || !root) {
    return <DatabaseNotFound />;
  }

  const role = extractEntryRole(root, workspace.userId);
  if (!role) {
    return <DatabaseNotFound />;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <DatabaseHeader database={database} role={role} />
      <DatabaseBody database={database} role={role} />
    </div>
  );
};
