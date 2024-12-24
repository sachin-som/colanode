import { SpaceEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';

interface SpaceBreadcrumbItemProps {
  space: SpaceEntry;
}

export const SpaceBreadcrumbItem = ({ space }: SpaceBreadcrumbItemProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Avatar
        size="small"
        id={space.id}
        name={space.attributes.name}
        avatar={space.attributes.avatar}
      />
      <span>{space.attributes.name}</span>
    </div>
  );
};
