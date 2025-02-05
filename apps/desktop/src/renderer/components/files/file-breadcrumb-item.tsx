import { FileThumbnail } from '@/renderer/components/files/file-thumbnail';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { LocalFileNode } from '@/shared/types/nodes';

interface FileBreadcrumbItemProps {
  file: LocalFileNode;
}

export const FileBreadcrumbItem = ({ file }: FileBreadcrumbItemProps) => {
  const workspace = useWorkspace();

  const { data } = useQuery({
    type: 'file_get',
    id: file.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (!data) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <FileThumbnail
        file={data}
        className="size-4 overflow-hidden rounded object-contain"
      />
      <span>{data.name}</span>
    </div>
  );
};
