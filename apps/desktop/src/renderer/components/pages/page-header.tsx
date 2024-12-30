import { EntryRole, PageEntry } from '@colanode/core';

import { EntryBreadcrumb } from '@/renderer/components/layouts/entry-breadcrumb';
import { EntryFullscreenButton } from '@/renderer/components/layouts/entry-fullscreen-button';
import { PageSettings } from '@/renderer/components/pages/page-settings';
import { Header } from '@/renderer/components/ui/header';
import { useContainer } from '@/renderer/contexts/container';

interface PageHeaderProps {
  page: PageEntry;
  role: EntryRole;
}

export const PageHeader = ({ page, role }: PageHeaderProps) => {
  const container = useContainer();

  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <div className="flex-grow">
          <EntryBreadcrumb entry={page} />
          {container.mode === 'modal' && (
            <EntryFullscreenButton entryId={page.id} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <PageSettings page={page} role={role} />
        </div>
      </div>
    </Header>
  );
};
