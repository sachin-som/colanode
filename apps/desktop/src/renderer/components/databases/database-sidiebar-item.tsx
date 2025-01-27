import { DatabaseEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useLayout } from '@/renderer/contexts/layout';
import { cn } from '@/shared/lib/utils';

interface DatabaseSidebarItemProps {
  database: DatabaseEntry;
}

export const DatabaseSidebarItem = ({ database }: DatabaseSidebarItemProps) => {
  const layout = useLayout();
  const isActive = layout.activeTab === database.id;
  const isUnread = false;
  const mentionsCount = 0;

  return (
    <button
      key={database.id}
      className={cn(
        'flex w-full items-center',
        isActive && 'bg-sidebar-accent'
      )}
    >
      <Avatar
        id={database.id}
        avatar={database.attributes.avatar}
        name={database.attributes.name}
        className="h-4 w-4"
      />
      <span
        className={cn(
          'line-clamp-1 w-full flex-grow pl-2 text-left',
          isUnread && 'font-bold'
        )}
      >
        {database.attributes.name ?? 'Unnamed'}
      </span>
      {mentionsCount > 0 && (
        <span className="mr-1 rounded-md bg-sidebar-accent px-1 py-0.5 text-xs text-sidebar-accent-foreground">
          {mentionsCount}
        </span>
      )}
      {mentionsCount == 0 && isUnread && (
        <span className="size-2 rounded-full bg-red-500" />
      )}
    </button>
  );
};
