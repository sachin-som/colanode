import { Fullscreen } from 'lucide-react';

import { useWorkspace } from '@/renderer/contexts/workspace';

interface EntryFullscreenButtonProps {
  entryId: string;
}

export const EntryFullscreenButton = ({
  entryId,
}: EntryFullscreenButtonProps) => {
  const workspace = useWorkspace();

  return (
    <Fullscreen
      className="size-5 cursor-pointer text-muted-foreground hover:text-foreground"
      onClick={() => {
        workspace.openInMain(entryId);
      }}
    />
  );
};
