import { MessageNode } from '@/shared/types/messages';
import { NodeRenderer } from '@/renderer/editor/renderers/node';
import { mapBlocksToContents } from '@/shared/lib/editor';

interface MessageContentProps {
  message: MessageNode;
}

export const MessageContent = ({ message }: MessageContentProps) => {
  const nodeBlocks = Object.values(message.attributes.blocks ?? {});
  const contents = mapBlocksToContents(message.id, nodeBlocks);

  return (
    <div className="text-foreground">
      {contents.map((node) => (
        <NodeRenderer
          key={node.attrs?.id}
          node={node}
          keyPrefix={node.attrs?.id}
        />
      ))}
    </div>
  );
};
