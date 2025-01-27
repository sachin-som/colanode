import { DatabaseEntry } from '@colanode/core';

import { DatabaseNotFound } from '@/renderer/components/databases/database-not-found';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/breadcrumbs/container-breadrumb';
import { useEntryContainer } from '@/renderer/hooks/use-entry-container';
import { useEntryRadar } from '@/renderer/hooks/use-entry-radar';
import { DatabaseSettings } from '@/renderer/components/databases/database-settings';
import { Database } from '@/renderer/components/databases/database';
import { DatabaseViews } from '@/renderer/components/databases/database-views';

interface DatabaseContainerProps {
  databaseId: string;
}

export const DatabaseContainer = ({ databaseId }: DatabaseContainerProps) => {
  const data = useEntryContainer<DatabaseEntry>(databaseId);

  useEntryRadar(data.entry);

  if (data.isPending) {
    return null;
  }

  if (!data.entry) {
    return <DatabaseNotFound />;
  }

  const { entry: database, role } = data;

  return (
    <Container>
      <ContainerHeader>
        <ContainerBreadcrumb breadcrumb={data.breadcrumb} />
        <ContainerSettings>
          <DatabaseSettings database={database} role={role} />
        </ContainerSettings>
      </ContainerHeader>
      <ContainerBody>
        <Database database={database} role={role}>
          <DatabaseViews />
        </Database>
      </ContainerBody>
    </Container>
  );
};
