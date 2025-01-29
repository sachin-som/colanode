import { FileBody } from '@/renderer/components/files/file-body';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/containers/container-breadrumb';
import { FileNotFound } from '@/renderer/components/files/file-not-found';
import { useFileContainer } from '@/renderer/hooks/use-file-container';
import { FileSettings } from '@/renderer/components/files/file-settings';

interface FileContainerProps {
  fileId: string;
}

export const FileContainer = ({ fileId }: FileContainerProps) => {
  const data = useFileContainer(fileId);

  if (data.isPending) {
    return null;
  }

  if (!data.file) {
    return <FileNotFound />;
  }

  return (
    <Container>
      <ContainerHeader>
        <ContainerBreadcrumb breadcrumb={data.breadcrumb} />
        <ContainerSettings>
          <FileSettings file={data.file} role={data.role} />
        </ContainerSettings>
      </ContainerHeader>
      <ContainerBody>
        <FileBody file={data.file} />
      </ContainerBody>
    </Container>
  );
};
