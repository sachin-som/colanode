import React from 'react';
import { NodeCollaboratorSearch } from '@/components/collaborators/node-collaborator-search';
import { NodeCollaboratorNode } from '@/types/nodes';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { NodeCollaboratorPermissionDropdown } from './node-collaborator-permission-dropdown';
import { useNodeCollaboratorCreateMutation } from '@/mutations/use-node-collaborator-create-mutation';
import { toast } from '../ui/use-toast';

interface NodeCollaboratorCreate {
  id: string;
  existingCollaborators: string[];
}

export const NodeCollaboratorCreate = ({
  id,
  existingCollaborators,
}: NodeCollaboratorCreate) => {
  const { mutate, isPending } = useNodeCollaboratorCreateMutation();

  const [collaborators, setCollaborators] = React.useState<
    NodeCollaboratorNode[]
  >([]);
  const [permission, setPermission] = React.useState('collaborator');

  return (
    <div className="flex flex-col gap-2">
      <NodeCollaboratorSearch
        value={collaborators}
        onChange={setCollaborators}
        excluded={existingCollaborators}
      />
      <div className="flex justify-end space-x-2">
        <NodeCollaboratorPermissionDropdown
          value={permission}
          onChange={setPermission}
        />
        <Button
          variant="default"
          className="shrink-0"
          size="sm"
          disabled={collaborators.length === 0 || isPending}
          onClick={() => {
            if (isPending) {
              return;
            }

            mutate(
              {
                nodeId: id,
                collaboratorIds: collaborators.map(
                  (collaborator) => collaborator.id,
                ),
                permission: permission,
              },
              {
                onSuccess() {
                  setCollaborators([]);
                },
                onError() {
                  toast({
                    title: 'Failed to add collaborators',
                    description:
                      'Something went wrong trying to add collaborators. Please try again.',
                    variant: 'destructive',
                  });
                },
              },
            );
          }}
        >
          {isPending && <Spinner className="mr-1" />}
          Invite
        </Button>
      </div>
    </div>
  );
};
