import { FileThumbnail } from '@/renderer/components/files/file-thumbnail';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface FileBreadcrumbItemProps {
  id: string;
}

export const FileBreadcrumbItem = ({ id }: FileBreadcrumbItemProps) => {
  const workspace = useWorkspace();

  const { data: file } = useQuery({
    type: 'file_get',
    id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (!file) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <FileThumbnail
        file={file}
        className="size-4 overflow-hidden rounded object-contain"
      />
      <span>{file.name}</span>
    </div>
  );
};
