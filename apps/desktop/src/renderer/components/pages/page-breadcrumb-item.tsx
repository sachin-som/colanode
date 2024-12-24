import { PageEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';

interface PageBreadcrumbItemProps {
  page: PageEntry;
}

export const PageBreadcrumbItem = ({ page }: PageBreadcrumbItemProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Avatar
        size="small"
        id={page.id}
        name={page.attributes.name}
        avatar={page.attributes.avatar}
      />
      <span>{page.attributes.name}</span>
    </div>
  );
};
