import { PageEntry } from '@colanode/core';

import { PageNotFound } from '@/renderer/components/pages/page-not-found';
import { useEntryContainer } from '@/renderer/hooks/use-entry-container';
import { useEntryRadar } from '@/renderer/hooks/use-entry-radar';
import { PageSettings } from '@/renderer/components/pages/page-settings';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/containers/container-breadrumb';
import { PageBody } from '@/renderer/components/pages/page-body';

interface PageContainerProps {
  pageId: string;
}

export const PageContainer = ({ pageId }: PageContainerProps) => {
  const data = useEntryContainer<PageEntry>(pageId);

  useEntryRadar(data.entry);

  if (data.isPending) {
    return null;
  }

  if (!data.entry) {
    return <PageNotFound />;
  }

  const { entry: page, role } = data;

  return (
    <Container>
      <ContainerHeader>
        <ContainerBreadcrumb breadcrumb={data.breadcrumb} />
        <ContainerSettings>
          <PageSettings page={page} role={role} />
        </ContainerSettings>
      </ContainerHeader>
      <ContainerBody>
        <PageBody page={page} role={role} />
      </ContainerBody>
    </Container>
  );
};
