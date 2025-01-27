import { ChatEntry } from '@colanode/core';

import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/breadcrumbs/container-breadrumb';
import { ChatNotFound } from '@/renderer/components/chats/chat-not-found';
import { EntryCollaboratorsPopover } from '@/renderer/components/collaborators/entry-collaborators-popover';
import { Conversation } from '@/renderer/components/messages/conversation';
import { useEntryRadar } from '@/renderer/hooks/use-entry-radar';
import { useEntryContainer } from '@/renderer/hooks/use-entry-container';

interface ChatContainerProps {
  chatId: string;
}

export const ChatContainer = ({ chatId }: ChatContainerProps) => {
  const data = useEntryContainer<ChatEntry>(chatId);

  useEntryRadar(data.entry);

  if (data.isPending) {
    return null;
  }

  if (!data.entry) {
    return <ChatNotFound />;
  }

  const { entry, role } = data;

  return (
    <Container>
      <ContainerHeader>
        <ContainerBreadcrumb breadcrumb={data.breadcrumb} />
        <ContainerSettings>
          <EntryCollaboratorsPopover
            entry={entry}
            entries={[entry]}
            role={role}
          />
        </ContainerSettings>
      </ContainerHeader>
      <ContainerBody>
        <Conversation
          conversationId={entry.id}
          rootId={entry.rootId}
          role={role}
        />
      </ContainerBody>
    </Container>
  );
};
