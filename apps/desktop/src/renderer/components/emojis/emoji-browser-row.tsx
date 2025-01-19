import React from 'react';

import { EmojiPickerRowData } from '@/shared/types/emojis';
import { EmojiBrowserEmojis } from '@/renderer/components/emojis/emoji-browser-emojis';
import { EmojiBrowserCategory } from '@/renderer/components/emojis/emoji-browser-category';

interface EmojiBrowserRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    rows: EmojiPickerRowData[];
  };
}

export const EmojiBrowserRow = ({
  index,
  data,
  style,
}: EmojiBrowserRowProps) => {
  const rowData = data.rows[index];

  if (!rowData) {
    return null;
  }

  if (rowData.type === 'label') {
    return <EmojiBrowserCategory row={rowData} style={style} />;
  }

  return <EmojiBrowserEmojis row={rowData} style={style} />;
};
