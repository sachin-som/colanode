import { ChannelEntry } from '@colanode/core';

import { ChannelNotFound } from '@/renderer/components/channels/channel-not-found';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/breadcrumbs/container-breadrumb';
import { useEntryContainer } from '@/renderer/hooks/use-entry-container';
import { ChannelSettings } from '@/renderer/components/channels/channel-settings';
import { Conversation } from '@/renderer/components/messages/conversation';
import { useEntryRadar } from '@/renderer/hooks/use-entry-radar';

interface ChannelContainerProps {
  channelId: string;
}

export const ChannelContainer = ({ channelId }: ChannelContainerProps) => {
  const data = useEntryContainer<ChannelEntry>(channelId);

  useEntryRadar(data.entry);

  if (data.isPending) {
    return null;
  }

  if (!data.entry) {
    return <ChannelNotFound />;
  }

  const { entry: channel, role } = data;

  return (
    <Container>
      <ContainerHeader>
        <ContainerBreadcrumb breadcrumb={data.breadcrumb} />
        <ContainerSettings>
          <ChannelSettings channel={channel} role={role} />
        </ContainerSettings>
      </ContainerHeader>
      <ContainerBody>
        <Conversation
          conversationId={channel.id}
          rootId={channel.rootId}
          role={role}
        />
      </ContainerBody>
    </Container>
  );
};
