import { extractEntryRole } from '@colanode/core';

import { DatabaseBody } from '@/renderer/components/databases/database-body';
import { DatabaseHeader } from '@/renderer/components/databases/database-header';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface DatabaseContainerProps {
  databaseId: string;
}

export const DatabaseContainer = ({ databaseId }: DatabaseContainerProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    type: 'entry_tree_get',
    entryId: databaseId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  const entries = data ?? [];
  const database = entries.find((entry) => entry.id === databaseId);
  const role = extractEntryRole(entries, workspace.userId);

  if (!database || database.type !== 'database' || !role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <DatabaseHeader entries={entries} database={database} role={role} />
      <DatabaseBody database={database} role={role} />
    </div>
  );
};
