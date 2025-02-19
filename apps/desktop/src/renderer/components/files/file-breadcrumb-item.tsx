import { FileThumbnail } from '@/renderer/components/files/file-thumbnail';
import { LocalFileNode } from '@/shared/types/nodes';

interface FileBreadcrumbItemProps {
  file: LocalFileNode;
}

export const FileBreadcrumbItem = ({ file }: FileBreadcrumbItemProps) => {
  return (
    <div className="flex items-center space-x-2">
      <FileThumbnail
        file={file}
        className="size-4 overflow-hidden rounded object-contain"
      />
      <span>{file.attributes.name}</span>
    </div>
  );
};
