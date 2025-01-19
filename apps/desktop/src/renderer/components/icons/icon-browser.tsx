import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';

import { IconPickerRowData } from '@/shared/types/icons';
import { IconPickerIconRow } from '@/renderer/components/icons/icon-browser-row';
import { useQuery } from '@/renderer/hooks/use-query';

const ICONS_PER_ROW = 10;

export const IconBrowser = () => {
  const { data } = useQuery({
    type: 'icon_category_list',
  });

  const categories = data ?? [];
  const rowDataArray = React.useMemo<IconPickerRowData[]>(() => {
    const rows: IconPickerRowData[] = [];

    for (const category of categories) {
      rows.push({
        type: 'label',
        category: category.name,
      });

      const numIcons = category.count;
      const numRowsInCategory = Math.ceil(numIcons / ICONS_PER_ROW);

      for (let i = 0; i < numRowsInCategory; i++) {
        rows.push({
          type: 'icon',
          category: category.id,
          page: i,
          count: ICONS_PER_ROW,
        });
      }
    }

    return rows;
  }, [categories]);

  return (
    <AutoSizer>
      {({ width, height }: { width: number; height: number }) => (
        <FixedSizeList
          width={width}
          height={height}
          itemCount={rowDataArray.length}
          itemSize={30}
          className="List"
          itemData={{ rows: rowDataArray }}
        >
          {IconPickerIconRow}
        </FixedSizeList>
      )}
    </AutoSizer>
  );
};
