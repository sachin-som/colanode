import React from 'react';
import isHotkey from 'is-hotkey';
import { Icon } from '@/components/ui/icon';
import { useWorkspace } from '@/contexts/workspace';
import { useMutation } from '@tanstack/react-query';
import { NeuronId } from '@/lib/id';
import { Spinner } from '@/components/ui/spinner';
import { RecordNode } from '@/types/databases';
import { sql } from 'kysely';

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
  const [name, setName] = React.useState(record.attrs?.name);

  const { mutate, isPending } = useMutation({
    mutationFn: async (newName: string) => {
      const query = sql`
        UPDATE nodes
        SET attrs = json_set(coalesce(attrs, '{}'), '$.name', ${newName}),
            updated_at = ${new Date().toISOString()},
            updated_by = ${workspace.userId},
            version_id = ${NeuronId.generate(NeuronId.Type.Version)}
        WHERE id = ${record.id}
      `.compile(workspace.schema);

      await workspace.mutate(query);
    },
  });

  React.useEffect(() => {
    setName(record.attrs?.name);
  }, [record.versionId]);

  const canEdit = true;
  const hasName = name && name.length > 0;

  const handleSave = (newName: string) => {
    setName(newName);
    mutate(newName, {
      onSuccess: () => {
        setIsEditing(false);
      },
    });
  };

  return (
    <div className="group relative flex h-full w-full items-center">
      {isEditing ? (
        <NameEditor
          initialValue={name}
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
              name
            ) : (
              <span className="text-muted-foreground">Untitled</span>
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
