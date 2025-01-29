import { FolderEntry } from '@colanode/core';

import { FolderNotFound } from '@/renderer/components/folders/folder-not-found';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/containers/container-breadrumb';
import { useEntryContainer } from '@/renderer/hooks/use-entry-container';
import { useEntryRadar } from '@/renderer/hooks/use-entry-radar';
import { FolderSettings } from '@/renderer/components/folders/folder-settings';
import { FolderBody } from '@/renderer/components/folders/folder-body';

interface FolderContainerProps {
  folderId: string;
}

export const FolderContainer = ({ folderId }: FolderContainerProps) => {
  const data = useEntryContainer<FolderEntry>(folderId);

  useEntryRadar(data.entry);

  if (data.isPending) {
    return null;
  }

  if (!data.entry) {
    return <FolderNotFound />;
  }

  const { entry: folder, role } = data;

  return (
    <Container>
      <ContainerHeader>
        <ContainerBreadcrumb breadcrumb={data.breadcrumb} />
        <ContainerSettings>
          <FolderSettings folder={folder} role={role} />
        </ContainerSettings>
      </ContainerHeader>
      <ContainerBody>
        <FolderBody folder={folder} role={role} />
      </ContainerBody>
    </Container>
  );
};
