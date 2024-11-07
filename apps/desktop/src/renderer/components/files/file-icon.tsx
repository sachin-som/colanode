import { FileImage, File, FileVideo, FileAudio, FileText } from 'lucide-react';

interface FileIconProps {
  mimeType: string;
  className?: string;
}

export const FileIcon = ({ mimeType, className }: FileIconProps) => {
  if (mimeType.startsWith('image')) {
    return <FileImage className={className} />;
  }

  if (mimeType.startsWith('video')) {
    return <FileVideo className={className} />;
  }

  if (mimeType.startsWith('audio')) {
    return <FileAudio className={className} />;
  }

  if (mimeType.startsWith('text')) {
    return <FileText className={className} />;
  }

  return <File className={className} />;
};
