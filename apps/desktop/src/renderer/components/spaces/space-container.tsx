import { SpaceEntry } from '@colanode/core';

import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/containers/container-breadrumb';
import { SpaceNotFound } from '@/renderer/components/spaces/space-not-found';
import { EntryCollaboratorsPopover } from '@/renderer/components/collaborators/entry-collaborators-popover';
import { useEntryRadar } from '@/renderer/hooks/use-entry-radar';
import { useEntryContainer } from '@/renderer/hooks/use-entry-container';
import { SpaceBody } from '@/renderer/components/spaces/space-body';

interface SpaceContainerProps {
  spaceId: string;
}

export const SpaceContainer = ({ spaceId }: SpaceContainerProps) => {
  const data = useEntryContainer<SpaceEntry>(spaceId);

  useEntryRadar(data.entry);

  if (data.isPending) {
    return null;
  }

  if (!data.entry) {
    return <SpaceNotFound />;
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
        <SpaceBody space={entry} role={role} />
      </ContainerBody>
    </Container>
  );
};
