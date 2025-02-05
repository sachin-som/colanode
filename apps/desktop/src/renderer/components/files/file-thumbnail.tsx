import { FileIcon } from '@/renderer/components/files/file-icon';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { getFileUrl } from '@/shared/lib/files';
import { cn } from '@/shared/lib/utils';
import { File } from '@/shared/types/files';

interface FileThumbnailProps {
  file: File;
  className?: string;
}

export const FileThumbnail = ({ file, className }: FileThumbnailProps) => {
  const workspace = useWorkspace();

  if (file.type === 'image' && file.downloadProgress === 100) {
    const url = getFileUrl(
      workspace.accountId,
      workspace.id,
      file.id,
      file.extension
    );
    return (
      <img
        src={url}
        alt={file.name}
        className={cn('object-contain object-center', className)}
      />
    );
  }

  return <FileIcon mimeType={file.mimeType} className="size-10" />;
};
