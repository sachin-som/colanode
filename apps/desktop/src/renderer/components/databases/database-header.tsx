import { DatabaseEntry, Entry, EntryRole } from '@colanode/core';

import { DatabaseSettings } from '@/renderer/components/databases/database-settings';
import { EntryBreadcrumb } from '@/renderer/components/layouts/entry-breadcrumb';
import { EntryFullscreenButton } from '@/renderer/components/layouts/entry-fullscreen-button';
import { Header } from '@/renderer/components/ui/header';
import { useContainer } from '@/renderer/contexts/container';

interface DatabaseHeaderProps {
  entries: Entry[];
  database: DatabaseEntry;
  role: EntryRole;
}

export const DatabaseHeader = ({
  entries,
  database,
  role,
}: DatabaseHeaderProps) => {
  const container = useContainer();

  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <div className="flex-grow">
          {container.mode === 'main' && <EntryBreadcrumb entries={entries} />}
          {container.mode === 'modal' && (
            <EntryFullscreenButton entryId={database.id} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <DatabaseSettings database={database} role={role} />
        </div>
      </div>
    </Header>
  );
};
