import { DatabaseEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';

interface DatabaseBreadcrumbItemProps {
  database: DatabaseEntry;
}

export const DatabaseBreadcrumbItem = ({
  database,
}: DatabaseBreadcrumbItemProps) => {
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
