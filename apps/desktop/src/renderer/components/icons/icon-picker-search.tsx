import React from 'react';
import { IconPickerItem } from '@/renderer/components/icons/icon-picker-item';
import { searchIcons } from '@/lib/icons';

interface IconPickerSearchProps {
  query: string;
}

export const IconPickerSearch = ({ query }: IconPickerSearchProps) => {
  const filteredIcons = React.useMemo(() => {
    return searchIcons(query);
  }, [query]);

  return (
    <div className="grid h-full min-h-full w-full min-w-full grid-cols-10 gap-1">
      <div className="col-span-full flex items-center py-1 pl-1 text-sm text-muted-foreground">
        <p>Search results for "{query}"</p>
      </div>
      {filteredIcons.map((icon) => (
        <IconPickerItem key={icon.id} icon={icon} />
      ))}
    </div>
  );
};
