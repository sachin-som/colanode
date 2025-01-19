import { EmojiPickerLabelRow } from '@/shared/types/emojis';

interface EmojiBrowserCategoryProps {
  row: EmojiPickerLabelRow;
  style: React.CSSProperties;
}

export const EmojiBrowserCategory = ({
  row,
  style,
}: EmojiBrowserCategoryProps) => {
  return (
    <div
      className="flex items-center pl-1 text-sm text-muted-foreground"
      style={style}
    >
      <p>{row.category}</p>
    </div>
  );
};
