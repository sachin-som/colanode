import { DatabaseEntry, extractEntryRole } from '@colanode/core';

import { DatabaseBody } from '@/renderer/components/databases/database-body';
import { DatabaseHeader } from '@/renderer/components/databases/database-header';
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

  const { data: root, isPending: isPendingRoot } = useQuery(
    {
      type: 'entry_get',
      entryId: database?.rootId ?? '',
      userId: workspace.userId,
    },
    {
      enabled: !!database?.rootId,
    }
  );

  if (isPendingEntry || isPendingRoot) {
    return null;
  }

  if (!database || !root) {
    return null;
  }

  const role = extractEntryRole(root, workspace.userId);
  if (!role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <DatabaseHeader database={database} role={role} />
      <DatabaseBody database={database} role={role} />
    </div>
  );
};
