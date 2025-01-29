import { DatabaseEntry, EntryRole } from '@colanode/core';

import { Database } from '@/renderer/components/databases/database';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface RecordDatabaseProps {
  id: string;
  role: EntryRole;
  children: React.ReactNode;
}

export const RecordDatabase = ({ id, role, children }: RecordDatabaseProps) => {
  const workspace = useWorkspace();

  const { data, isPending } = useQuery({
    type: 'entry_get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    entryId: id,
  });

  if (isPending) {
    return null;
  }

  if (!data) {
    return null;
  }

  return (
    <Database database={data as DatabaseEntry} role={role}>
      {children}
    </Database>
  );
};
