import React from 'react';
import { EmojiPickerRowData } from '@/lib/emojis';
import { EmojiPickerItem } from '@/components/emojis/emoji-picker-item';

interface EmojiPickerBrowserRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    rows: EmojiPickerRowData[];
  };
}

export const EmojiPickerBrowserRow = ({
  index,
  style,
  data,
}: EmojiPickerBrowserRowProps) => {
  const rowData = data.rows[index];

  if (rowData.type === 'label') {
    return (
      <div
        style={style}
        className="flex items-center pl-1 text-sm text-muted-foreground"
      >
        <p>{rowData.category}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-1" style={style}>
      {rowData.emojis.map((emoji) => (
        <EmojiPickerItem key={emoji.id} emoji={emoji} />
      ))}
    </div>
  );
};
