import { FileThumbnail } from '@/renderer/components/files/file-thumbnail';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface FileContainerTabProps {
  fileId: string;
}

export const FileContainerTab = ({ fileId }: FileContainerTabProps) => {
  const workspace = useWorkspace();

  const { data: file } = useQuery({
    type: 'file_get',
    id: fileId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (!file) {
    return <p>Not found</p>;
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
