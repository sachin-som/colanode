import { FolderEntry, Entry, EntryRole } from '@colanode/core';

import { FolderSettings } from '@/renderer/components/folders/folder-settings';
import { EntryBreadcrumb } from '@/renderer/components/layouts/entry-breadcrumb';
import { EntryFullscreenButton } from '@/renderer/components/layouts/entry-fullscreen-button';
import { Header } from '@/renderer/components/ui/header';
import { useContainer } from '@/renderer/contexts/container';

interface FolderHeaderProps {
  entries: Entry[];
  folder: FolderEntry;
  role: EntryRole;
}

export const FolderHeader = ({ entries, folder, role }: FolderHeaderProps) => {
  const container = useContainer();

  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <div className="flex-grow">
          <EntryBreadcrumb entries={entries} />
          {container.mode === 'modal' && (
            <EntryFullscreenButton entryId={folder.id} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <FolderSettings folder={folder} role={role} />
        </div>
      </div>
    </Header>
  );
};
