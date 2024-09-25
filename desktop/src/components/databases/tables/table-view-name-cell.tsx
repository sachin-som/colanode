import React from 'react';
import isHotkey from 'is-hotkey';
import { Icon } from '@/components/ui/icon';
import { useWorkspace } from '@/contexts/workspace';
import { Spinner } from '@/components/ui/spinner';
import { RecordNode } from '@/types/databases';
import { useNodeAttributeSetMutation } from '@/mutations/use-node-attribute-set-mutation';

interface NameEditorProps {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

const NameEditor = ({ initialValue, onSave, onCancel }: NameEditorProps) => {
  const [value, setValue] = React.useState(initialValue ?? '');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleBlur = () => {
    onSave(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isHotkey('enter', e)) {
      e.preventDefault();
      onSave(value);
    } else if (isHotkey('esc', e)) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="flex h-full w-full cursor-text flex-row items-center gap-1 p-1 text-sm"
    />
  );
};

interface TableViewNameCellProps {
  record: RecordNode;
}

export const TableViewNameCell = ({ record }: TableViewNameCellProps) => {
  const workspace = useWorkspace();
  const [isEditing, setIsEditing] = React.useState(false);

  const { mutate, isPending } = useNodeAttributeSetMutation();
  const canEdit = true;
  const hasName = record.name && record.name.length > 0;

  const handleSave = (newName: string) => {
    mutate(
      {
        nodeId: record.id,
        key: 'name',
        value: newName,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  };

  return (
    <div className="group relative flex h-full w-full items-center">
      {isEditing ? (
        <NameEditor
          initialValue={record.name ?? ''}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <>
          <div
            onClick={() => canEdit && setIsEditing(true)}
            className="flex h-full w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm"
          >
            {hasName ? (
              record.name
            ) : (
              <span className="text-muted-foreground">Unnamed</span>
            )}
          </div>
          <button
            type="button"
            className="absolute right-2 flex h-6 cursor-pointer flex-row items-center gap-1 rounded-md border bg-white p-1 text-sm text-muted-foreground opacity-0 hover:bg-gray-50 group-hover:opacity-100"
            onClick={() => workspace.openModal(record.id)}
          >
            <Icon name="edit-box-line" /> <p>Open</p>
          </button>
          {isPending && (
            <span className="absolute right-2 text-muted-foreground">
              <Spinner size="small" />
            </span>
          )}
        </>
      )}
    </div>
  );
};
