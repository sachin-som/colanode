import React from 'react';
import { EntryRole } from '@colanode/core';

import { User } from '@/shared/types/users';
import { EntryCollaboratorRoleDropdown } from '@/renderer/components/collaborators/entry-collaborator-role-dropdown';
import { EntryCollaboratorSearch } from '@/renderer/components/collaborators/entry-collaborator-search';
import { Button } from '@/renderer/components/ui/button';
import { Spinner } from '@/renderer/components/ui/spinner';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

interface EntryCollaboratorCreateProps {
  entryId: string;
  existingCollaborators: string[];
}

export const EntryCollaboratorCreate = ({
  entryId,
  existingCollaborators,
}: EntryCollaboratorCreateProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const [users, setUsers] = React.useState<User[]>([]);
  const [role, setRole] = React.useState<EntryRole>('editor');

  return (
    <div className="flex flex-col gap-2">
      <EntryCollaboratorSearch
        value={users}
        onChange={setUsers}
        excluded={existingCollaborators}
      />
      <div className="flex justify-end space-x-2">
        <EntryCollaboratorRoleDropdown
          value={role}
          onChange={setRole}
          canEdit={true}
        />
        <Button
          variant="default"
          className="shrink-0"
          size="sm"
          disabled={users.length === 0 || isPending}
          onClick={() => {
            if (isPending) {
              return;
            }

            mutate({
              input: {
                type: 'entry_collaborator_create',
                entryId,
                collaboratorIds: users.map((user) => user.id),
                role: role,
                accountId: workspace.accountId,
                workspaceId: workspace.id,
              },
              onSuccess() {
                setUsers([]);
              },
              onError(error) {
                toast({
                  title: 'Failed to add collaborators',
                  description: error.message,
                  variant: 'destructive',
                });
              },
            });
          }}
        >
          {isPending && <Spinner className="mr-1" />}
          Invite
        </Button>
      </div>
    </div>
  );
};
