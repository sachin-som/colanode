import React from 'react';
import { Icon } from '@/components/ui/icon';
import { useDatabase } from '@/contexts/database';
import { useRecordCreateMutation } from '@/mutations/use-record-create-mutation';
import { useWorkspace } from '@/contexts/workspace';

export const TableViewRecordCreateRow = () => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const { mutate, isPending } = useRecordCreateMutation();

  return (
    <button
      type="button"
      disabled={isPending}
      className="animate-fade-in flex h-8 w-full cursor-pointer flex-row items-center gap-1 border-b pl-2 text-muted-foreground hover:bg-gray-50"
      onClick={() => {
        mutate(
          {
            databaseId: database.id,
          },
          {
            onSuccess: (recordId) => {
              workspace.openModal(recordId);
            },
          },
        );
      }}
    >
      <Icon name="add-line" />
      <span className="text-sm">Add record</span>
    </button>
  );
};
