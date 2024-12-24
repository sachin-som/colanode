import { Entry, EntryRole } from '@colanode/core';

import { FileSettings } from '@/renderer/components/files/file-settings';
import { EntryBreadcrumb } from '@/renderer/components/layouts/entry-breadcrumb';
import { EntryFullscreenButton } from '@/renderer/components/layouts/entry-fullscreen-button';
import { Header } from '@/renderer/components/ui/header';
import { useContainer } from '@/renderer/contexts/container';
import { FileWithState } from '@/shared/types/files';

interface FileHeaderProps {
  entries: Entry[];
  file: FileWithState;
  role: EntryRole;
}

export const FileHeader = ({ entries, file }: FileHeaderProps) => {
  const container = useContainer();

  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <div className="flex-grow">
          {container.mode === 'main' && <EntryBreadcrumb entries={entries} />}
          {container.mode === 'modal' && (
            <EntryFullscreenButton entryId={file.id} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <FileSettings fileId={file.id} />
        </div>
      </div>
    </Header>
  );
};
