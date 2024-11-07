import { defaultClasses } from '@/renderer/editor/classes';
import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';
import { JSONContent } from '@tiptap/core';

interface ListItemRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const ListItemRenderer = ({
  node,
  keyPrefix,
}: ListItemRendererProps) => {
  return (
    <li className={defaultClasses.listItem}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </li>
  );
};
