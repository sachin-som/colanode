import React from 'react';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { RecordNode } from '@/registry';
import { SelectFieldAttributes, SelectOptionAttributes } from '@/registry';
import { useDrag } from 'react-dnd';
import { cn } from '@/lib/utils';

interface BoardViewCardProps {
  record: RecordNode;
}

interface DragResult {
  option: SelectOptionAttributes;
  field: SelectFieldAttributes;
}

export const BoardViewCard = ({ record }: BoardViewCardProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const [, drag] = useDrag({
    type: 'board-record',
    item: { id: record.id },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<DragResult>();
      if (dropResult != null) {
        if (isPending) return;
        const optionId = dropResult.option.id;
        const fieldId = dropResult.field.id;

        const currentFieldValue = record.attributes.fields[fieldId];
        const currentOptionId =
          currentFieldValue?.type === 'select'
            ? currentFieldValue.value
            : undefined;

        if (currentOptionId === optionId) {
          return;
        }

        mutate({
          input: {
            type: 'node_attribute_set',
            nodeId: record.id,
            path: fieldId,
            value: optionId,
            userId: workspace.userId,
          },
        });
      }
    },
  });

  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const dragRef = drag(buttonRef);
  const name = record.attributes.name;
  const hasName = name !== null && name !== '';

  return (
    <button
      ref={dragRef as any}
      role="presentation"
      key={record.id}
      className={cn(
        'animate-fade-in flex cursor-pointer flex-col gap-1 rounded-md border p-2 text-left hover:bg-gray-50',
        hasName ? '' : 'text-muted-foreground',
      )}
      onClick={() => workspace.openModal(record.id)}
    >
      {name ?? 'Unnamed'}
    </button>
  );
};
