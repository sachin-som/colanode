import { getFileUrl } from '@/lib/files';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { FilePreview } from '@/renderer/components/files/file-preview';
import { FileDownload } from '@/renderer/components/files/file-download';

interface FileBlockProps {
  id: string;
}

export const FileBlock = ({ id }: FileBlockProps) => {
  const workspace = useWorkspace();

  const { data } = useQuery({
    type: 'file_get',
    fileId: id,
    userId: workspace.userId,
  });

  if (!data) {
    return null;
  }

  const url = getFileUrl(workspace.userId, data.id, data.extension);
  return (
    <div
      className="flex h-72 max-h-72 w-full cursor-pointer overflow-hidden rounded-md p-2 hover:bg-gray-100"
      onClick={() => {
        workspace.openModal(id);
      }}
    >
      {data.downloadProgress !== 100 ? (
        <FileDownload id={data.id} downloadProgress={data.downloadProgress} />
      ) : (
        <FilePreview url={url} name={data.name} mimeType={data.mimeType} />
      )}
    </div>
  );
};
