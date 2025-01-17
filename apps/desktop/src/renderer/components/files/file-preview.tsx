import { match } from 'ts-pattern';

import { FileDownload } from '@/renderer/components/files/file-download';
import { FilePreviewImage } from '@/renderer/components/files/previews/file-preview-image';
import { FilePreviewOther } from '@/renderer/components/files/previews/file-preview-other';
import { FilePreviewVideo } from '@/renderer/components/files/previews/file-preview-video';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { getFileUrl } from '@/shared/lib/files';
import { FileWithState } from '@/shared/types/files';

interface FilePreviewProps {
  file: FileWithState;
}

export const FilePreview = ({ file }: FilePreviewProps) => {
  const workspace = useWorkspace();

  if (file.downloadProgress !== 100) {
    return <FileDownload file={file} />;
  }

  const url = getFileUrl(
    workspace.accountId,
    workspace.id,
    file.id,
    file.extension
  );

  return match(file.type)
    .with('image', () => <FilePreviewImage url={url} name={file.name} />)
    .with('video', () => <FilePreviewVideo url={url} />)
    .otherwise(() => <FilePreviewOther mimeType={file.mimeType} />);
};
