import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { IconPickerRowData, iconCategories, icons } from '@/lib/icons';
import { IconPickerBrowserRow } from '@/renderer/components/icons/icon-picker-browser-row';

const iconsPerRow = 10;

export const IconPickerBrowser = () => {
  const rowDataArray = React.useMemo<IconPickerRowData[]>(() => {
    const rows: IconPickerRowData[] = [];

    for (let i = 0; i < iconCategories.length; i++) {
      // Add the category label
      rows.push({
        type: 'label',
        category: iconCategories[i],
      });

      const numIcons = icons[i].length;
      const numRowsInCategory = Math.ceil(numIcons / iconsPerRow);

      for (let rowIndex = 0; rowIndex < numRowsInCategory; rowIndex++) {
        const start = rowIndex * iconsPerRow;
        const end = start + iconsPerRow;
        const iconsInRow = icons[i].slice(start, end);

        rows.push({
          type: 'icon',
          icons: iconsInRow,
        });
      }
    }

    return rows;
  }, []);

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
          {IconPickerBrowserRow}
        </FixedSizeList>
      )}
    </AutoSizer>
  );
};
