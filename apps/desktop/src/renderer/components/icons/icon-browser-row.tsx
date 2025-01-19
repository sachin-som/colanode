import React from 'react';

import { IconBrowserCategory } from '@/renderer/components/icons/icon-browser-category';
import { IconBrowserIcons } from '@/renderer/components/icons/icon-browser-icons';
import { IconPickerRowData } from '@/shared/types/icons';

interface IconPickerIconRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    rows: IconPickerRowData[];
  };
}

export const IconPickerIconRow = ({
  index,
  style,
  data,
}: IconPickerIconRowProps) => {
  const rowData = data.rows[index];

  if (!rowData) {
    return null;
  }

  if (rowData.type === 'label') {
    return <IconBrowserCategory row={rowData} style={style} />;
  }

  return <IconBrowserIcons row={rowData} style={style} />;
};
