import { Entry, EntryRole, RecordEntry } from '@colanode/core';

import { EntryBreadcrumb } from '@/renderer/components/layouts/entry-breadcrumb';
import { EntryFullscreenButton } from '@/renderer/components/layouts/entry-fullscreen-button';
import { RecordSettings } from '@/renderer/components/records/record-settings';
import { Header } from '@/renderer/components/ui/header';
import { useContainer } from '@/renderer/contexts/container';

interface RecordHeaderProps {
  entries: Entry[];
  record: RecordEntry;
  role: EntryRole;
}

export const RecordHeader = ({ entries, record, role }: RecordHeaderProps) => {
  const container = useContainer();

  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <div className="flex-grow">
          {container.mode === 'main' && <EntryBreadcrumb entries={entries} />}
          {container.mode === 'modal' && (
            <EntryFullscreenButton entryId={record.id} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <RecordSettings record={record} role={role} />
        </div>
      </div>
    </Header>
  );
};
