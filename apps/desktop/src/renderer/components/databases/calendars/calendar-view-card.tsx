import { useWorkspace } from '@/renderer/contexts/workspace';
import { RecordNode } from '@colanode/core';
import { cn } from '@/shared/lib/utils';

interface CalendarViewCardProps {
  record: RecordNode;
}

export const CalendarViewCard = ({ record }: CalendarViewCardProps) => {
  const workspace = useWorkspace();

  const name = record.attributes.name;
  const hasName = name !== null && name !== '';

  return (
    <button
      role="presentation"
      key={record.id}
      className={cn(
        'animate-fade-in flex cursor-pointer flex-col gap-1 rounded-md border p-2 hover:bg-gray-50',
        hasName ? '' : 'text-muted-foreground'
      )}
      onClick={() => workspace.openInModal(record.id)}
    >
      {name ?? 'Unnamed'}
    </button>
  );
};
