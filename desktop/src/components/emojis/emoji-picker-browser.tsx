import { EmojiPickerRowData, categories, emojis } from '@/lib/emojis';
import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { EmojiPickerBrowserRow } from '@/components/emojis/emoji-picker-browser-row';

const emojisPerRow = 10;

export const EmojiPickerBrowser = () => {
  const rowDataArray = React.useMemo<EmojiPickerRowData[]>(() => {
    const rows: EmojiPickerRowData[] = [];

    for (let i = 0; i < categories.length; i++) {
      // Add the category label
      rows.push({
        type: 'label',
        category: categories[i],
      });

      const numEmojis = emojis[i].length;
      const numRowsInCategory = Math.ceil(numEmojis / emojisPerRow);

      for (let rowIndex = 0; rowIndex < numRowsInCategory; rowIndex++) {
        const start = rowIndex * emojisPerRow;
        const end = start + emojisPerRow;
        const emojisInRow = emojis[i].slice(start, end);

        rows.push({
          type: 'emoji',
          emojis: emojisInRow,
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
          {EmojiPickerBrowserRow}
        </FixedSizeList>
      )}
    </AutoSizer>
  );
};
