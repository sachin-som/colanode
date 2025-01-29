import { DatabaseEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface DatabaseContainerTabProps {
  databaseId: string;
}

export const DatabaseContainerTab = ({
  databaseId,
}: DatabaseContainerTabProps) => {
  const workspace = useWorkspace();

  const { data: entry } = useQuery({
    type: 'entry_get',
    entryId: databaseId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const database = entry as DatabaseEntry;
  if (!database) {
    return <p>Not found</p>;
  }

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        size="small"
        id={database.id}
        name={database.attributes.name}
        avatar={database.attributes.avatar}
      />
      <span>{database.attributes.name}</span>
    </div>
  );
};
