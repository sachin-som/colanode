import React from 'react';
import { Icon } from '@/renderer/components/ui/icon';
import { Spinner } from '@/renderer/components/ui/spinner';

interface TableViewLoadMoreRowProps {
  isPending: boolean;
  onClick: () => void;
}

export const TableViewLoadMoreRow = ({
  isPending,
  onClick,
}: TableViewLoadMoreRowProps) => {
  return (
    <button
      type="button"
      disabled={isPending}
      className="animate-fade-in flex h-8 w-full cursor-pointer flex-row items-center gap-1 border-b pl-2 text-muted-foreground hover:bg-gray-50"
      onClick={() => {
        onClick();
      }}
    >
      {isPending ? <Spinner /> : <Icon name="arrow-down-line" />}
      <span className="text-sm">Load more</span>
    </button>
  );
};
