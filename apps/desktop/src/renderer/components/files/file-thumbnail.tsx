import { FileIcon } from '@/renderer/components/files/file-icon';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { getFileUrl } from '@/shared/lib/files';
import { cn } from '@/shared/lib/utils';
import { FileWithState } from '@/shared/types/files';

interface FileThumbnailProps {
  file: FileWithState;
  className?: string;
}

export const FileThumbnail = ({ file, className }: FileThumbnailProps) => {
  const workspace = useWorkspace();

  if (file.type === 'image' && file.downloadProgress === 100) {
    const url = getFileUrl(workspace.userId, file.id, file.extension);
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
