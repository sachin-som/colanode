import { defaultClasses } from '@/renderer/editor/classes';
import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';
import { cn } from '@/shared/lib/utils';
import { JSONContent } from '@tiptap/core';

interface ParagraphRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const ParagraphRenderer = ({
  node,
  keyPrefix,
}: ParagraphRendererProps) => {
  return (
    <p className={cn(defaultClasses.paragraph, 'py-0.5')}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </p>
  );
};
