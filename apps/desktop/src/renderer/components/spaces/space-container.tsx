import { SpaceEntry } from '@colanode/core';

import {
  Container,
  ContainerBody,
  ContainerHeader,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/containers/container-breadrumb';
import { SpaceNotFound } from '@/renderer/components/spaces/space-not-found';
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
      </ContainerHeader>
      <ContainerBody>
        <SpaceBody space={entry} role={role} />
      </ContainerBody>
    </Container>
  );
};
