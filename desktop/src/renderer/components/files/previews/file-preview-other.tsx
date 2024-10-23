import React from 'react';
import { getFileIcon, getFriendlyNameFromMimeType } from '@/lib/files';
import { Icon } from '@/renderer/components/ui/icon';

interface FilePreviewOtherProps {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
}

export const FilePreviewOther = ({
  id,
  name,
  extension,
  mimeType,
}: FilePreviewOtherProps) => {
  const friendlyName = getFriendlyNameFromMimeType(mimeType);
  const icon = getFileIcon(mimeType);

  return (
    <div className="flex flex-col items-center gap-3">
      <Icon name={icon} className="h-10 w-10" />
      <p className="text-sm text-muted-foreground">
        No preview available for {friendlyName}
      </p>
    </div>
  );
};
