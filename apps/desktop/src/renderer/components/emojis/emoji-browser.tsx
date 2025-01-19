import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';

import { EmojiPickerRowData } from '@/shared/types/emojis';
import { EmojiBrowserRow } from '@/renderer/components/emojis/emoji-browser-row';
import { useQuery } from '@/renderer/hooks/use-query';

const EMOJIS_PER_ROW = 10;

export const EmojiBrowser = () => {
  const { data } = useQuery({
    type: 'emoji_category_list',
  });

  const categories = data ?? [];
  const rowDataArray = React.useMemo<EmojiPickerRowData[]>(() => {
    const rows: EmojiPickerRowData[] = [];

    for (const category of categories) {
      rows.push({
        type: 'label',
        category: category.name,
      });

      const numEmojis = category.count;
      const numRowsInCategory = Math.ceil(numEmojis / EMOJIS_PER_ROW);

      for (let i = 0; i < numRowsInCategory; i++) {
        rows.push({
          type: 'emoji',
          category: category.id,
          page: i,
          count: EMOJIS_PER_ROW,
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
          {EmojiBrowserRow}
        </FixedSizeList>
      )}
    </AutoSizer>
  );
};
