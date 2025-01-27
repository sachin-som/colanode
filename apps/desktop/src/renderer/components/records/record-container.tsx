import { RecordEntry } from '@colanode/core';

import { RecordNotFound } from '@/renderer/components/records/record-not-found';
import { useEntryContainer } from '@/renderer/hooks/use-entry-container';
import { useEntryRadar } from '@/renderer/hooks/use-entry-radar';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/breadcrumbs/container-breadrumb';
import { RecordBody } from '@/renderer/components/records/record-body';
import { RecordSettings } from '@/renderer/components/records/record-settings';

interface RecordContainerProps {
  recordId: string;
}

export const RecordContainer = ({ recordId }: RecordContainerProps) => {
  const data = useEntryContainer<RecordEntry>(recordId);

  useEntryRadar(data.entry);

  if (data.isPending) {
    return null;
  }

  if (!data.entry) {
    return <RecordNotFound />;
  }

  const { entry: record, role } = data;

  return (
    <Container>
      <ContainerHeader>
        <ContainerBreadcrumb breadcrumb={data.breadcrumb} />
        <ContainerSettings>
          <RecordSettings record={record} role={role} />
        </ContainerSettings>
      </ContainerHeader>
      <ContainerBody>
        <RecordBody record={record} role={role} />
      </ContainerBody>
    </Container>
  );
};
