import { ChatEntry, EntryRole } from '@colanode/core';

import { EntryCollaboratorsPopover } from '@/renderer/components/collaborators/entry-collaborators-popover';
import { EntryBreadcrumb } from '@/renderer/components/layouts/entry-breadcrumb';
import { EntryFullscreenButton } from '@/renderer/components/layouts/entry-fullscreen-button';
import { Header } from '@/renderer/components/ui/header';
import { useContainer } from '@/renderer/contexts/container';

interface ChatHeaderProps {
  chat: ChatEntry;
  role: EntryRole;
}

export const ChatHeader = ({ chat, role }: ChatHeaderProps) => {
  const container = useContainer();

  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <div className="flex-grow">
          <EntryBreadcrumb entry={chat} />
          {container.mode === 'modal' && (
            <EntryFullscreenButton entryId={chat.id} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <EntryCollaboratorsPopover
            entryId={chat.id}
            entries={[chat]}
            role={role}
          />
        </div>
      </div>
    </Header>
  );
};
