import { JSONContent } from '@tiptap/core';

import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { defaultClasses } from '@/renderer/editor/classes';

interface MentionRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const MentionRenderer = ({ node }: MentionRendererProps) => {
  const workspace = useWorkspace();

  const target = node.attrs?.target;
  const { data } = useQuery({
    type: 'user_get',
    userId: target,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const name = data?.name ?? 'Unknown';
  return (
    <span className={defaultClasses.mention}>
      <Avatar
        size="small"
        id={target ?? '?'}
        name={name}
        avatar={data?.avatar}
      />
      <span role="presentation">{name}</span>
    </span>
  );
};
