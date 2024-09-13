import React from 'react';
import { useWorkspace } from '@/contexts/workspace';
import { RecordNode } from '@/types/databases';
import { cn } from '@/lib/utils';

interface CalendarViewCardProps {
  record: RecordNode;
}

export const CalendarViewCard = ({ record }: CalendarViewCardProps) => {
  const workspace = useWorkspace();

  const name = record.name;
  const hasName = name !== null && name !== '';

  return (
    <button
      role="presentation"
      key={record.id}
      className={cn(
        'animate-fade-in flex cursor-pointer flex-col gap-1 rounded-md border p-2 hover:bg-gray-50',
        hasName ? '' : 'text-muted-foreground',
      )}
      onClick={() => workspace.openModal(record.id)}
    >
      {record.name ?? 'Unnamed'}
    </button>
  );
};
