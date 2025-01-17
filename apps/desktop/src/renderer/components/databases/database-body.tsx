import { DatabaseEntry, EntryRole } from '@colanode/core';
import { useEffect } from 'react';

import { Database } from '@/renderer/components/databases/database';
import { DatabaseViews } from '@/renderer/components/databases/database-views';
import { useRadar } from '@/renderer/contexts/radar';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface DatabaseBodyProps {
  database: DatabaseEntry;
  role: EntryRole;
}

export const DatabaseBody = ({ database, role }: DatabaseBodyProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  useEffect(() => {
    radar.markEntryAsOpened(workspace.accountId, workspace.id, database.id);

    const interval = setInterval(() => {
      radar.markEntryAsOpened(workspace.accountId, workspace.id, database.id);
    }, 60000);

    return () => clearInterval(interval);
  }, [database.id, database.type, database.transactionId]);

  return (
    <Database database={database} role={role}>
      <DatabaseViews />
    </Database>
  );
};
