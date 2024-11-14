import { useWorkspace } from '@/renderer/contexts/workspace';
import { Fullscreen } from 'lucide-react';

interface NodeFullscreenButtonProps {
  nodeId: string;
}

export const NodeFullscreenButton = ({ nodeId }: NodeFullscreenButtonProps) => {
  const workspace = useWorkspace();

  return (
    <Fullscreen
      className="size-5 cursor-pointer text-muted-foreground hover:text-foreground"
      onClick={() => {
        workspace.openInMain(nodeId);
      }}
    />
  );
};
