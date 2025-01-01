import { ChannelEntry, EntryRole } from '@colanode/core';

import { ChannelSettings } from '@/renderer/components/channels/channel-settings';
import { EntryBreadcrumb } from '@/renderer/components/layouts/entry-breadcrumb';
import { EntryFullscreenButton } from '@/renderer/components/layouts/entry-fullscreen-button';
import { Header } from '@/renderer/components/ui/header';
import { useContainer } from '@/renderer/contexts/container';

interface ChannelHeaderProps {
  channel: ChannelEntry;
  role: EntryRole;
}

export const ChannelHeader = ({ channel, role }: ChannelHeaderProps) => {
  const container = useContainer();

  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <div className="flex-grow">
          {container.mode === 'main' && <EntryBreadcrumb entry={channel} />}
          {container.mode === 'modal' && (
            <EntryFullscreenButton entryId={channel.id} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <ChannelSettings channel={channel} role={role} />
        </div>
      </div>
    </Header>
  );
};
