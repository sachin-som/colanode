import { EntryRole } from '@colanode/core';
import { Trash2 } from 'lucide-react';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { EntryCollaboratorRoleDropdown } from '@/renderer/components/collaborators/entry-collaborator-role-dropdown';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useQuery } from '@/renderer/hooks/use-query';
import { toast } from '@/renderer/hooks/use-toast';

interface EntryCollaboratorProps {
  entryId: string;
  collaboratorId: string;
  role: EntryRole;
  canEdit: boolean;
  canRemove: boolean;
}

export const EntryCollaborator = ({
  entryId,
  collaboratorId,
  role,
  canEdit,
  canRemove,
}: EntryCollaboratorProps) => {
  const workspace = useWorkspace();
  const { mutate } = useMutation();

  const { data } = useQuery({
    type: 'user_get',
    id: collaboratorId,
    userId: workspace.userId,
  });

  if (!data) {
    return null;
  }

  return (
    <div className="flex items-center justify-between space-x-3">
      <div className="flex items-center space-x-3">
        <Avatar id={data.id} name={data.name} avatar={data.avatar} />
        <div className="flex-grow">
          <p className="text-sm font-medium leading-none">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.email}</p>
        </div>
      </div>
      <div className="flex flex-row items-center gap-1">
        <EntryCollaboratorRoleDropdown
          value={role}
          canEdit={canEdit}
          onChange={(newRole) => {
            mutate({
              input: {
                type: 'entry_collaborator_update',
                entryId: entryId,
                collaboratorId: collaboratorId,
                role: newRole,
                userId: workspace.userId,
              },
              onError(error) {
                toast({
                  title: 'Failed to update collaborator',
                  description: error.message,
                  variant: 'destructive',
                });
              },
            });
          }}
        />
        {canRemove && (
          <Trash2
            className="size-4 cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={() => {
              mutate({
                input: {
                  type: 'entry_collaborator_delete',
                  entryId: entryId,
                  collaboratorId: collaboratorId,
                  userId: workspace.userId,
                },
              });
            }}
          />
        )}
      </div>
    </div>
  );
};
