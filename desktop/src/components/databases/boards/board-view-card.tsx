import React from 'react';
import { useWorkspace } from '@/contexts/workspace';
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import {
  RecordNode,
  SelectFieldNode,
  SelectOptionNode,
} from '@/types/databases';
import { useDrag } from 'react-dnd';

interface BoardViewCardProps {
  record: RecordNode;
}

interface DragResult {
  option: SelectOptionNode;
  field: SelectFieldNode;
}

export const BoardViewCard = ({ record }: BoardViewCardProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useNodeAttributeUpsertMutation();

  const [, drag] = useDrag({
    type: 'board-record',
    item: { id: record.id },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<DragResult>();
      if (dropResult != null) {
        if (isPending) return;
        const optionId = dropResult.option.id;
        const fieldId = dropResult.field.id;

        const currentOptionId = record.attributes?.find(
          (v) => v.type === fieldId && v.foreignNodeId === optionId,
        )?.foreignNodeId;

        if (currentOptionId === optionId) {
          return;
        }

        mutate({
          nodeId: record.id,
          type: fieldId,
          key: '1',
          foreignNodeId: optionId,
          textValue: null,
          numberValue: null,
        });
      }
    },
  });

  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const dragRef = drag(buttonRef);

  return (
    <button
      ref={dragRef as any}
      role="presentation"
      key={record.id}
      className="animate-fade-in flex cursor-pointer flex-col gap-1 rounded-md border p-2 hover:bg-gray-50"
      onClick={() => workspace.openModal(record.id)}
    >
      <p>{record.name}</p>
    </button>
  );
};
